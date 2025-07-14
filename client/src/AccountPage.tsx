import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '';


interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  type_of_disability?: string;
  province?: string;
  city?: string;
  date_valid?: string;
}

// Extend edit state to allow password
type EditUser = Partial<User> & { password?: string };

function decodeJWT(token: string): { id: number } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.id };
  } catch {
    return null;
  }
}

const AccountPage: React.FC<{ token: string }> = ({ token }) => {
  const [user, setUser] = useState<User | null>(null);
  const [edit, setEdit] = useState<EditUser>({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const userId = decodeJWT(token)?.id;

  useEffect(() => {
    if (!userId) return;
    const fetchMe = async () => {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setEdit(data);
      }
    };
    fetchMe();
  }, [token, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEdit({ ...edit, [name]: value });
  } 

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!userId) return;
    const payload: any = {
      firstName: edit.first_name,
      lastName: edit.last_name,
      typeOfDisability: edit.type_of_disability,
      province: edit.province,
      city: edit.city,
      dateValid: edit.date_valid,
    };
    if (edit.password) payload.password = edit.password;
    const res = await fetch(`${API_URL}/users/${userId}/self`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setSuccess('Account updated!');
      const data = await res.json();
      setUser(data);
    } else {
      setError('Failed to update account');
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h2>My Account</h2>
      <form onSubmit={handleUpdate}>
        <input name="first_name" value={edit.first_name || ''} onChange={handleChange} placeholder="First Name" required />
        <input name="last_name" value={edit.last_name || ''} onChange={handleChange} placeholder="Last Name" required />
        <input name="type_of_disability" value={edit.type_of_disability || ''} onChange={handleChange} placeholder="Type of Disability" />
        <input name="province" value={edit.province || ''} onChange={handleChange} placeholder="Province" />
        <input name="city" value={edit.city || ''} onChange={handleChange} placeholder="City" />
        <input name="date_valid" type="date" value={edit.date_valid || ''} onChange={handleChange} placeholder="Date Valid" />
        <input name="password" type="password" value={edit.password || ''} onChange={e => setEdit({ ...edit, password: e.target.value })} placeholder="New Password (optional)" autoComplete="new-password" />
        <button type="submit">Update</button>
      </form>
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AccountPage;
