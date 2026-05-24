import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { T } from '../constants/theme'

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
          background: T.bgInput, border: `1px solid ${T.border}`,
          color: T.textPrimary, padding: '10px 40px 10px 12px', borderRadius: 8,
          fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
          ...style
        }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: T.textMuted,
          cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'
        }}
      >
        {show ? <EyeOff size={16}/> : <Eye size={16}/>}
      </button>
    </div>
  )
}
