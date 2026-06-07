import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { NATIONALITIES } from '../lib/nationalities'

function Modal({ title, initial, onSave, onClose }) {
  const [form, setForm] = useState(initial)
  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.employee_id.trim() || !form.name.trim() || !form.nationality) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md" style={{ background: '#fff', border: '1px solid #000' }}>
        {/* Modal header — black bar */}
        <div className="px-6 py-4" style={{ background: '#000', borderBottom: '3px solid #A100FF' }}>
          <h2 className="text-sm font-bold tracking-widest text-white uppercase">{title}</h2>
        </div>
        <form onSubmit={submit} className="px-6 py-6 space-y-5">
          {[
            { key: 'employee_id', label: 'Employee ID', placeholder: 'EMP-001' },
            { key: 'name', label: 'Full Name', placeholder: 'Jane Smith' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5"
                style={{ color: '#666' }}>
                {label}
              </label>
              <input
                className="w-full px-3 py-2.5 text-sm font-medium"
                style={{ border: '1px solid #000', background: '#F2F2F2', outline: 'none' }}
                onFocus={e => e.target.style.outline = '2px solid #A100FF'}
                onBlur={e => e.target.style.outline = 'none'}
                value={form[key]}
                onChange={e => handle(key, e.target.value)}
                placeholder={placeholder}
                required
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase mb-1.5"
              style={{ color: '#666' }}>
              Nationality
            </label>
            <select
              className="w-full px-3 py-2.5 text-sm font-medium"
              style={{ border: '1px solid #000', background: '#F2F2F2', outline: 'none' }}
              onFocus={e => e.target.style.outline = '2px solid #A100FF'}
              onBlur={e => e.target.style.outline = 'none'}
              value={form.nationality}
              onChange={e => handle('nationality', e.target.value)}
              required
            >
              <option value="">Select nationality…</option>
              {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-bold tracking-widest uppercase transition-colors"
              style={{ border: '1px solid #000', background: '#fff', color: '#000', cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.background = '#F2F2F2'}
              onMouseLeave={e => e.target.style.background = '#fff'}
            >
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 text-sm font-bold tracking-widest uppercase transition-colors"
              style={{ background: '#A100FF', color: '#fff', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.background = '#7B00C2'}
              onMouseLeave={e => e.target.style.background = '#A100FF'}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EmployeePage() {
  const { getToken } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const res = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load employees')
      setEmployees(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmployees() }, [])

  const handleSave = async (form) => {
    const token = await getToken()
    if (modal.mode === 'add') {
      await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
    } else {
      await fetch(`/api/employees/${modal.data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
    }
    setModal(null)
    fetchEmployees()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return
    setDeleting(id)
    const token = await getToken()
    await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    setDeleting(null)
    fetchEmployees()
  }

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    e.nationality.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {modal && (
        <Modal
          title={modal.mode === 'add' ? 'Add Employee' : 'Edit Employee'}
          initial={modal.data}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Page header */}
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#000' }}>
            Employees
          </h1>
          <div className="mt-1 h-0.5 w-12" style={{ background: '#A100FF' }} />
          <p className="text-sm mt-2" style={{ color: '#666' }}>
            Manage team members and their cultural profiles
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add', data: { employee_id: '', name: '', nationality: '' } })}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-widest uppercase transition-colors shrink-0"
          style={{ background: '#A100FF', color: '#fff', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.target.style.background = '#7B00C2'}
          onMouseLeave={e => e.target.style.background = '#A100FF'}
        >
          + ADD EMPLOYEE
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          className="w-full max-w-sm px-3 py-2.5 text-sm"
          style={{ border: '1px solid #000', background: '#fff' }}
          placeholder="Search by name, ID or nationality…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E6E6E6' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: '#999' }}>
            Loading…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: '#cc0000' }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-3xl font-bold" style={{ color: '#E6E6E6' }}>—</div>
            <p className="text-sm" style={{ color: '#999' }}>
              {search ? 'No employees match your search' : 'No employees yet — add one to get started'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#000', borderBottom: '3px solid #A100FF' }}>
                {['Employee ID', 'Name', 'Nationality', ''].map((h, i) => (
                  <th key={i}
                    className="px-5 py-3 text-left text-xs font-bold tracking-widest uppercase"
                    style={{ color: '#fff' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <tr key={emp.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #E6E6E6' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5E6FF'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-5 py-3.5 font-mono text-xs" style={{ color: '#666' }}>
                    {emp.employee_id}
                  </td>
                  <td className="px-5 py-3.5 font-semibold" style={{ color: '#000' }}>
                    {emp.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-3 py-0.5 text-xs font-bold tracking-wide uppercase"
                      style={{ background: '#F5E6FF', color: '#7B00C2', border: '1px solid #E8B4FF' }}>
                      {emp.nationality}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal({
                          mode: 'edit',
                          data: { employee_id: emp.employee_id, name: emp.name, nationality: emp.nationality, id: emp.id }
                        })}
                        className="px-3 py-1 text-xs font-bold tracking-wide uppercase transition-colors"
                        style={{ border: '1px solid #000', background: '#fff', color: '#000', cursor: 'pointer' }}
                        onMouseEnter={e => e.target.style.background = '#F2F2F2'}
                        onMouseLeave={e => e.target.style.background = '#fff'}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        disabled={deleting === emp.id}
                        className="px-3 py-1 text-xs font-bold tracking-wide uppercase transition-colors"
                        style={{ border: '1px solid #cc0000', background: '#fff', color: '#cc0000', cursor: 'pointer', opacity: deleting === emp.id ? 0.4 : 1 }}
                        onMouseEnter={e => { if (deleting !== emp.id) e.target.style.background = '#fff0f0' }}
                        onMouseLeave={e => e.target.style.background = '#fff'}
                      >
                        {deleting === emp.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs mt-2 ml-1" style={{ color: '#999' }}>
        {employees.length} employee{employees.length !== 1 ? 's' : ''} total
      </p>
    </div>
  )
}
