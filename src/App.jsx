import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Dashboard from './Dashboard'
import './App.css'


function App() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [player, setPlayer] = useState(null)
  


  useEffect(() => {
    const savedPlayer = localStorage.getItem('wc2026_player')
    const loginTime = localStorage.getItem('wc2026_time')

    if (savedPlayer && loginTime) {
      const now = Date.now()
      const diff = now - Number(loginTime)

      const fifteenMinutes =
        15 * 60 * 1000

      if (diff < fifteenMinutes) {
        setPlayer(
          JSON.parse(savedPlayer)
        )
      } else {
        localStorage.removeItem(
          'wc2026_player'
        )
        localStorage.removeItem(
          'wc2026_time'
        )
      }
    }
  }, [])

  async function login() {
    const { data, error } =
      await supabase
        .from('players')
        .select('*')
        .eq('name', name)
        .eq('password', password)
        .single()

    if (error || !data) {
      setMessage(
        'Zle heslo Crnec'
      )
      return
    }

    setPlayer(data)

    localStorage.setItem(
      'wc2026_player',
      JSON.stringify(data)
    )

    localStorage.setItem(
      'wc2026_time',
      Date.now()
    )
  }

  function logout() {
    localStorage.removeItem(
      'wc2026_player'
    )

    localStorage.removeItem(
      'wc2026_time'
    )

    setPlayer(null)
  }

  if (player) {
    return (
      <Dashboard
        player={player}
        logout={logout}
      />
    )
  }

  return (
    <div
     style={{
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background:
    'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #06b6d4 100%)'
}}
    >
      <div
  style={{
    width: '380px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(15px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
  }}
>
<div
  style={{
    fontSize: '60px',
    textAlign: 'center',
    marginBottom: '10px',
    animation: 'float 2.5s ease-in-out infinite',
    filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.6))'
  }}
>
  🏆
</div>

<h1
  style={{
    color: 'white',
    fontSize: '30px',
    marginBottom: '10px',
    letterSpacing: '2px'
  }}
>
  WORLD CUP
</h1>
        <p
  style={{
    color: 'rgba(255,255,255,0.8)',
    marginTop: '0',
    marginBottom: '25px',
    fontSize: '14px',
    letterSpacing: '1px'
  }}
>
  2026
</p>

        <input
          placeholder="Meno"
          value={name}
          onChange={e =>
            setName(e.target.value)
          }
          style={{
  width: '100%',
  padding: '14px 16px',
  fontSize: '16px',
  borderRadius: '12px',
  border: 'none',
  outline: 'none',
  boxSizing: 'border-box'
}}
        />

        <br />
        <br />

        <input
          placeholder="Heslo"
          type="password"
          value={password}
          onChange={e =>
            setPassword(
              e.target.value
            )
            
          }
        style={{
  width: '100%',
  padding: '14px 16px',
  fontSize: '16px',
  borderRadius: '12px',
  border: 'none',
  outline: 'none',
  boxSizing: 'border-box'
}}
        />

        <br />
        <br />

        <button
          onClick={login}
         style={{
  padding: '14px 28px',
  background: '#d4a017',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer',
  boxShadow: '0 6px 16px rgba(212,160,23,0.35)'
}}
        >
          Login
        </button>

        <p>{message}</p>
       <div
  style={{
    marginTop: '20px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '11px',
    letterSpacing: '1px'
  }}
>
  CREATED BY IVAN PONICAN version 2.0
</div>
      </div>
    </div>
  )
}

export default App