import React, { useState } from 'react';

const Register: React.FC = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    typeOfDisability: '',
    province: '',
    city: '',
    isAdmin: false,
    masterPassword: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    let submitForm: any = { ...form };
    if (!form.isAdmin) {
      // Set dateValid to 5 years from today
      const today = new Date();
      const fiveYears = new Date(today.getFullYear() + 5, today.getMonth(), today.getDate());
      submitForm.dateValid = fiveYears.toISOString().slice(0, 10);
    } else {
      submitForm.dateValid = '';
      submitForm.province = '';
      submitForm.city = '';
    }
    const res = await fetch(`${process.env.REACT_APP_API_URL || ''}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitForm)
    });
    if (res.ok) {
      setSuccess('Registration successful!');
      setForm({
        firstName: '', lastName: '', username: '', password: '',
        typeOfDisability: '', province: '', city: '', isAdmin: false, masterPassword: ''
      });
    } else {
      setError('Registration failed');
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required />
        <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required />
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        {!form.isAdmin && (
          <>
            <input name="typeOfDisability" placeholder="Type of Disability" value={form.typeOfDisability} onChange={handleChange} required />
            <input name="province" placeholder="Province" value={form.province} onChange={handleChange} required />
            <input name="city" placeholder="City" value={form.city} onChange={handleChange} required />
          </>
        )}
        {form.isAdmin && (
          <input name="masterPassword" type="password" placeholder="Master Password" value={form.masterPassword} onChange={handleChange} required />
        )}
        <label>
          <input name="isAdmin" type="checkbox" checked={form.isAdmin} onChange={handleChange} /> Register as Admin
        </label>
        <button type="submit">Register</button>
      </form>
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Register;
