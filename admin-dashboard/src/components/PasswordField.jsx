import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordField({ name, value, onChange, placeholder = 'Password', style = {}, required }) {
  const [show, setShow] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <input
        name={name}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          background: '#131c30', border: '1px solid #1a2540',
          color: '#fff', padding: '10px 40px 10px 12px', borderRadius: 8,
          fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
          ...style
        }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: '#4a5568',
          cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'
        }}
      >
        {show ? <EyeOff size={16}/> : <Eye size={16}/>}
      </button>
    </div>
  )
}
