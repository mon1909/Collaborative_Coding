import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import 'C:\Users\monic\OneDrive\Documents\Projects\cocode\src\App.css';
import axios from 'axios'; // Import axios for HTTP requests

function Login() {
  const [usn, setUsn] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (usn === '' || name === '' || department === '' || subjectCode === '') {
      setError('All fields are required');
      setIsSubmitted(false);
    } else {
      setError('');
      setIsSubmitted(true);
      axios.post('http://localhost:3000/register', { usn, name, department, subjectCode })
        .then(response => {
          console.log(response.data.message);
          setIsSubmitted(true);
          // Reset the form fields after a short delay
          setTimeout(() => {
            resetForm();
          }, 2000);
        })
        .catch(error => {
          console.error('There was an error!', error);
          setError('There was an issue with the submission. Please try again.');
          setIsSubmitted(false);
        });
    }
  };

  const resetForm = () => {
    setUsn('');
    setName('');
    setDepartment('');
    setSubjectCode('');
    setError('');
    setIsSubmitted(false);
  };

  return (
    <div className="App">
      <div className="container col-4 bg-info p-4">
        <div className="login-form rounded p-4 bg-light">
          <h2>Student Registration Form</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">USN</label>
              <input
                type="text"
                className="form-control"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-control"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Subject Code</label>
              <select
                className="form-control"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
              >
                <option value="">Select Subject Code</option>
                <option value="CS641-cloud computing">CS641-cloud computing</option>
                <option value="CS642-Ethical Hacking">CS642-Ethical Hacking</option>
                <option value="CS644-Unix Programming">CS644-Unix Programming</option>
              </select>
            </div>
            {error && <p className="text-danger">{error}</p>}
            <button type="submit" className="btn btn-primary">Submit</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={resetForm}>Cancel</button>
          </form>
        </div>
      </div>
      {isSubmitted && !error && (
        <p className="text-success mt-3">Thank you for submitting the details!</p>
      )}
    </div>
  );
}
