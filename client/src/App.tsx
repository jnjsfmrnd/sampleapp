import React, { useEffect, useState } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  type_of_disability?: string;
  province?: string;
  city?: string;
  date_valid?: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    typeOfDisability: '',
    province: '',
    city: '',
    dateValid: ''
  });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/users`);
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        typeOfDisability: form.typeOfDisability,
        province: form.province,
        city: form.city,
        dateValid: form.dateValid
      })
    });
    setForm({ firstName: '', lastName: '', username: '', typeOfDisability: '', province: '', city: '', dateValid: '' });
    fetchUsers();
  };

  return (
    <div className="App">
      <h1>User Management</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input name="firstName" type="text" placeholder="First Name" value={form.firstName} onChange={handleChange} required />
        <input name="lastName" type="text" placeholder="Last Name" value={form.lastName} onChange={handleChange} required />
        <input name="username" type="text" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="typeOfDisability" type="text" placeholder="Type of Disability" value={form.typeOfDisability} onChange={handleChange} />
        <input name="province" type="text" placeholder="Province" value={form.province} onChange={handleChange} />
        <input name="city" type="text" placeholder="City" value={form.city} onChange={handleChange} />
        <input name="dateValid" type="date" placeholder="Date Valid" value={form.dateValid} onChange={handleChange} />
        <button type="submit">Add User</button>
      </form>
      <h2>User List</h2>
      {loading ? <p>Loading...</p> : (
        <table>
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Username</th>
              <th>Type of Disability</th>
              <th>Province</th>
              <th>City</th>
              <th>Date Valid</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.first_name}</td>
                <td>{user.last_name}</td>
                <td>{user.username}</td>
                <td>{user.type_of_disability || ''}</td>
                <td>{user.province || ''}</td>
                <td>{user.city || ''}</td>
                <td>{user.date_valid || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
