"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [hours, setHours] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [updateSubjectId, setUpdateSubjectId] = useState('');
  const [hoursToAdd, setHoursToAdd] = useState<number | ''>('');

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [resetUserId, setResetUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [attendanceStats, setAttendanceStats] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  const [showRanking, setShowRanking] = useState(false);
  const [rankingData, setRankingData] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/'); 
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchSubjects();
      
      if (parsedUser.username === 'Visura' || parsedUser.username === 'admin') {
        fetchAllUsers();
      }
    }
  }, []);

  useEffect(() => {
    if (user) fetchAttendanceStats();
  }, [user]);

  const fetchSubjects = async () => {
    const { data, error } = await supabase.from('subjects').select('*').order('course_code', { ascending: true });
    if (data) setSubjects(data);
    if (error) console.error("Error fetching subjects:", error);
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from('users').select('id, full_name, username').order('full_name', { ascending: true });
    if (data) setAllUsers(data);
  };

  const fetchAttendanceStats = async () => {
    if (!user) return;
    const { data: subs } = await supabase.from('subjects').select('*').order('course_code', { ascending: true });
    const { data: logs } = await supabase.from('attendance_logs').select('*').eq('student_id', user.id).order('logged_at', { ascending: false });

    if (subs && logs) {
      const stats = subs.map(sub => {
        const loggedHours = logs
          .filter(log => log.subject_id === sub.id)
          .reduce((sum, log) => sum + log.hours, 0);
        
        let percentage = 0;
        if (sub.total_hours > 0) percentage = (loggedHours / sub.total_hours) * 100;

        return { ...sub, loggedHours, percentage: percentage.toFixed(2) };
      });
      setAttendanceStats(stats);

      const formattedHistory = logs.map(log => {
        const sub = subs.find(s => s.id === log.subject_id);
        return {
          ...log,
          subject_name: sub ? sub.subject_name : 'Unknown Subject',
          course_code: sub ? sub.course_code : ''
        };
      });
      setHistoryLogs(formattedHistory);
    }
  };

  const markAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return toast.error('Please select a subject!');

    const { error } = await supabase.from('attendance_logs').insert([{
      student_id: user.id,
      subject_id: parseInt(selectedSubject),
      hours: hours,
      logged_at: selectedDate
    }]);

    if (error) toast.error('An error occurred: ' + error.message);
    else {
      toast.success('Attendance marked successfully!');
      setHours(1);
      setSelectedSubject(''); 
      fetchAttendanceStats(); 
    }
  };

  const handleDeleteLog = async (logId: number) => {
    if(!confirm("Are you sure you want to delete this record?")) return;

    const { error } = await supabase.from('attendance_logs').delete().eq('id', logId);
    if (error) toast.error('Failed to delete: ' + error.message);
    else {
      toast.success('Attendance record deleted!');
      fetchAttendanceStats(); 
    }
  };

  const handleAddHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateSubjectId || hoursToAdd === '') return toast.error('Please fill all fields!');

    const subjectToUpdate = subjects.find(sub => sub.id === parseInt(updateSubjectId));
    if (!subjectToUpdate) return toast.error('Invalid subject selected!');

    const calculatedTotalHours = subjectToUpdate.total_hours + parseInt(hoursToAdd.toString());

    const { error } = await supabase.from('subjects').update({ total_hours: calculatedTotalHours }).eq('id', parseInt(updateSubjectId));

    if (error) toast.error('Failed to update: ' + error.message);
    else {
      toast.success(`Added ${hoursToAdd} hours! New total is ${calculatedTotalHours}h.`);
      setHoursToAdd('');
      setUpdateSubjectId('');
      fetchSubjects(); 
      fetchAttendanceStats(); 
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId || !newPassword) return toast.error('Please fill all fields!');

    const { error } = await supabase.from('users').update({ password: newPassword }).eq('id', parseInt(resetUserId));

    if (error) toast.error('Failed to reset password: ' + error.message);
    else {
      toast.success('Password reset successfully!');
      setResetUserId('');
      setNewPassword('');
    }
  };

  const handleOpenRankings = async () => {
    const { data: allDBUsers } = await supabase.from('users').select('id, full_name, username');
    const { data: allDBSubjects } = await supabase.from('subjects').select('total_hours');
    const { data: allDBLogs } = await supabase.from('attendance_logs').select('student_id, hours');

    if (allDBUsers && allDBSubjects && allDBLogs) {
      const maxPossibleHours = allDBSubjects.reduce((sum, sub) => sum + sub.total_hours, 0);

      const ranks = allDBUsers.map(u => {
        const userLogs = allDBLogs.filter(log => log.student_id === u.id);
        const userTotalHours = userLogs.reduce((sum, log) => sum + log.hours, 0);
        
        let percentage = 0;
        if (maxPossibleHours > 0) {
          percentage = (userTotalHours / maxPossibleHours) * 100;
        }

        return {
          id: u.id,
          full_name: u.full_name,
          username: u.username,
          totalHours: userTotalHours,
          percentage: parseFloat(percentage.toFixed(2))
        };
      });

      ranks.sort((a, b) => b.percentage - a.percentage);
      
      let currentRank = 1;
      const finalRanks = ranks.map((rank, index) => {
        if (index > 0 && rank.percentage < ranks[index - 1].percentage) {
          currentRank = index + 1;
        }
        return { ...rank, displayRank: currentRank };
      });
      
      setRankingData(finalRanks);
      setShowRanking(true);
    } else {
      toast.error('Failed to fetch rankings data!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-black">Loading...</div>;

  const isAdmin = user.username === 'Visura' || user.username === 'admin';
  const todayStr = new Date().toISOString().split('T')[0]; 

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-black relative flex flex-col">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto flex-1 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 bg-white p-4 rounded-lg shadow gap-4 text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-bold text-blue-600">Welcome, {user.full_name}</h1>
          <div className="flex flex-wrap justify-center md:justify-end gap-2 w-full md:w-auto">
            <button onClick={handleOpenRankings} className="flex-1 md:flex-none bg-yellow-500 text-white font-bold px-3 py-2 md:px-4 rounded hover:bg-yellow-600 transition duration-200 text-sm md:text-base">
              🏆 Rankings
            </button>
            <button onClick={() => setShowHistory(true)} className="flex-1 md:flex-none bg-gray-800 text-white font-bold px-3 py-2 md:px-4 rounded hover:bg-gray-900 transition duration-200 text-sm md:text-base">
              History
            </button>
            <button onClick={handleLogout} className="flex-1 md:flex-none bg-red-500 text-white font-bold px-3 py-2 md:px-4 rounded hover:bg-red-600 transition duration-200 text-sm md:text-base">
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
          <div className={`bg-white p-4 md:p-6 rounded-lg shadow-md ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <h2 className="text-lg md:text-xl font-bold mb-4">Mark Attendance</h2>
            <form onSubmit={markAttendance} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-40">
                <label className="block text-gray-700 text-sm font-bold mb-2">Date</label>
                <input type="date" max={todayStr} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-gray-700 text-sm font-bold mb-2">Subject</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} required>
                  <option value="">-- Select a Subject --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-24">
                <label className="block text-gray-700 text-sm font-bold mb-2">Hours</label>
                <input type="number" min="1" max="8" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" value={hours} onChange={(e) => setHours(parseInt(e.target.value))} required />
              </div>
              <button type="submit" className="w-full md:w-auto bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 h-10 transition duration-200 mt-2 md:mt-0">
                Submit
              </button>
            </form>
          </div>

          {isAdmin && (
            <div className="flex flex-col gap-6">
              <div className="bg-blue-50 p-4 md:p-6 rounded-lg shadow-md border-2 border-blue-200">
                <h2 className="text-md md:text-lg font-bold mb-4 text-blue-800">Add Conducted Hours</h2>
                <form onSubmit={handleAddHours} className="flex flex-col gap-4">
                  <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white" value={updateSubjectId} onChange={(e) => setUpdateSubjectId(e.target.value)} required>
                    <option value="">-- Select Subject --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
                    ))}
                  </select>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="number" placeholder="Hours" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white" value={hoursToAdd} onChange={(e) => setHoursToAdd(parseInt(e.target.value))} required />
                    <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200">Add</button>
                  </div>
                </form>
              </div>

              <div className="bg-purple-50 p-4 md:p-6 rounded-lg shadow-md border-2 border-purple-200">
                <h2 className="text-md md:text-lg font-bold mb-4 text-purple-800">Reset Password</h2>
                <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
                  <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black bg-white" value={resetUserId} onChange={(e) => setResetUserId(e.target.value)} required>
                    <option value="">-- Select Student --</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name} (@{u.username})</option>
                    ))}
                  </select>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" placeholder="New Password" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black bg-white" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    <button type="submit" className="w-full sm:w-auto bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-200">Reset</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md w-full overflow-hidden">
          <h2 className="text-lg md:text-xl font-bold mb-4">My Attendance Summary</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-200 text-gray-700 text-sm md:text-base">
                  <th className="px-3 py-2 md:px-4 md:py-2 border">Course Code</th>
                  <th className="px-3 py-2 md:px-4 md:py-2 border">Subject Name</th>
                  <th className="px-3 py-2 md:px-4 md:py-2 border text-center">My Hours</th>
                  <th className="px-3 py-2 md:px-4 md:py-2 border text-center">Total Hours</th>
                  <th className="px-3 py-2 md:px-4 md:py-2 border text-center">Percentage</th>
                </tr>
              </thead>
              <tbody className="text-sm md:text-base">
                {attendanceStats.map((stat, index) => (
                  <tr key={index} className="hover:bg-gray-50 border-b">
                    <td className="px-3 py-2 md:px-4 md:py-2 border font-semibold">{stat.course_code}</td>
                    <td className="px-3 py-2 md:px-4 md:py-2 border">{stat.subject_name}</td>
                    <td className="px-3 py-2 md:px-4 md:py-2 border text-center">{stat.loggedHours}</td>
                    <td className="px-3 py-2 md:px-4 md:py-2 border text-center">{stat.total_hours}</td>
                    <td className={`px-3 py-2 md:px-4 md:py-2 border text-center font-bold ${
                      stat.total_hours === 0 ? 'text-gray-500' :
                      parseFloat(stat.percentage) >= 80 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.total_hours === 0 ? 'N/A' : `${stat.percentage}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Section */}
        <footer className="mt-12 py-8 border-t border-gray-200 text-center text-gray-600">
          <p className="font-semibold text-base">
            © 2026 UniAttend - All Rights Reserved
          </p>
          <p className="mt-1 text-sm">
            Developed by <span className="font-bold text-blue-600">Visura De Silva</span>
          </p>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
            Trincomalee Campus, Eastern University, Sri Lanka
          </p>
        </footer>

      </div>

      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2 sm:pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Attendance History</h2>
              <button onClick={() => setShowHistory(false)} className="text-red-500 font-bold hover:text-red-700 bg-red-100 px-2 py-1 sm:px-3 sm:py-1 rounded text-sm sm:text-base">
                Close ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {historyLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No attendance records found.</p>
              ) : (
                <div className="overflow-x-auto pb-4">
                  <table className="min-w-full table-auto text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 text-sm sm:text-base">
                        <th className="px-3 py-2 sm:px-4 sm:py-2 border">Date</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-2 border">Subject</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-2 border text-center">Hours</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-2 border text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm sm:text-base">
                      {historyLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 border-b">
                          <td className="px-3 py-2 sm:px-4 sm:py-2 border font-semibold text-gray-700">{log.logged_at}</td>
                          <td className="px-3 py-2 sm:px-4 sm:py-2 border">{log.course_code} - {log.subject_name}</td>
                          <td className="px-3 py-2 sm:px-4 sm:py-2 border text-center">{log.hours} h</td>
                          <td className="px-3 py-2 sm:px-4 sm:py-2 border text-center">
                            <button onClick={() => handleDeleteLog(log.id)} className="text-red-500 hover:text-red-700 hover:underline text-xs sm:text-sm font-bold">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRanking && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2 sm:pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">🏆 Leaderboard</h2>
              <button onClick={() => setShowRanking(false)} className="text-red-500 font-bold hover:text-red-700 bg-red-100 px-2 py-1 sm:px-3 sm:py-1 rounded text-sm sm:text-base">
                Close ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {rankingData.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No data available to generate rankings.</p>
              ) : (
                <div className="overflow-x-auto pb-4">
                  <table className="min-w-full table-auto text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-yellow-100 text-yellow-800 text-sm sm:text-base">
                        <th className="px-3 py-2 sm:px-4 sm:py-2 border text-center">Rank</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-2 border">Student Name</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-2 border text-center">Total Attended</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-2 border text-center">Overall Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm sm:text-base">
                      {rankingData.map((rank) => (
                        <tr key={rank.id} className={`border-b ${user.id === rank.id ? 'bg-yellow-50 font-bold' : 'hover:bg-gray-50'}`}>
                          <td className="px-3 py-2 sm:px-4 sm:py-2 border text-center text-base sm:text-lg">{rank.displayRank}</td>
                          <td className="px-3 py-2 sm:px-4 sm:py-2 border">
                            {rank.full_name} <span className="text-gray-500 text-xs sm:text-sm font-normal">(@{rank.username})</span>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-2 border text-center">{rank.totalHours} h</td>
                          <td className={`px-3 py-2 sm:px-4 sm:py-2 border text-center ${rank.percentage >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                            {rank.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
