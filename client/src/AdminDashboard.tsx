import React, { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  type_of_disability?: string;
  province?: string;
  city?: string;
  date_valid?: string;
  is_admin?: boolean;
}

const API_URL = process.env.REACT_APP_API_URL || '';

const AdminDashboard: React.FC<{ token: string }> = ({ token }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState<{ [id: number]: Partial<User> }>({});
  const [deleteAdminId, setDeleteAdminId] = useState<number | null>(null);
  const [masterPassword, setMasterPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleEditChange = (id: number, field: string, value: string) => {
    setEditUser({
      ...editUser,
      [id]: { ...editUser[id], [field]: value }
    });
  };

  const handleUpdate = async (id: number) => {
    setError('');
    // Find the user to update
    const user = users.find(u => u.id === id);
    if (!user) return;
    // Merge edited fields with existing user data
    const updatedUser = { ...user, ...editUser[id] };
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updatedUser)
    });
    if (res.ok) {
      fetchUsers();
      setEditUser({ ...editUser, [id]: {} });
    } else {
      setError('Failed to update user');
    }
  };

  const handleDelete = async (id: number, isAdmin: boolean) => {
    setError('');
    let options: any = {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    };
    if (isAdmin) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify({ masterPassword });
    }
    const res = await fetch(`${API_URL}/users/${id}`, options);
    if (res.ok) {
      fetchUsers();
      setDeleteAdminId(null);
      setMasterPassword('');
    } else {
      setError('Failed to delete user');
    }
  };

  // Generate 10 random users
  const handleGenerateRandom = async () => {
    setError('');
    setLoading(true);
    const res = await fetch(`${API_URL}/users/generate-random`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchUsers();
    } else {
      setError('Failed to generate random users');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <button onClick={handleGenerateRandom} disabled={loading} style={{ marginBottom: 16 }}>
        Generate 10 Random Users
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? <p>Loading...</p> : (
        <table>
          <thead>
            <tr>
              <th>Last Name</th>
              <th>First Name</th>
              <th>Type of Disability</th>
              <th>Admin</th>
              <th>Update</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.last_name}</td>
                <td>{user.first_name}</td>
                <td>{user.type_of_disability || ''}</td>
                <td>{user.is_admin ? 'Yes' : 'No'}</td>
                <td>
                  {!user.is_admin && <button onClick={() => handleUpdate(user.id)}>Update</button>}
                </td>
                <td>
                  {user.is_admin ? (
                    <>
                      <button onClick={() => setDeleteAdminId(user.id)}>Delete</button>
                      {deleteAdminId === user.id && (
                        <div>
                          <input
                            type="password"
                            placeholder="Master Password"
                            value={masterPassword}
                            onChange={e => setMasterPassword(e.target.value)}
                          />
                          <button onClick={() => handleDelete(user.id, true)}>Confirm Delete</button>
                          <button onClick={() => { setDeleteAdminId(null); setMasterPassword(''); }}>Cancel</button>
                        </div>
                      )}
                    </>
                  ) : (
                    <button onClick={() => handleDelete(user.id, false)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;
