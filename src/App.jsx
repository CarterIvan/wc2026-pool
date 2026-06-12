import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Dashboard from './Dashboard'

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
        alignItems: 'center'
      }}
    >
      <div
        style={{
          width: '300px',
          textAlign: 'center'
        }}
      >
        <h1>WC2026 Login</h1>

        <input
          placeholder="Ime"
          value={name}
          onChange={e =>
            setName(e.target.value)
          }
          style={{
            width: '100%',
            padding: '10px'
          }}
        />

        <br />
        <br />

        <input
          placeholder="Lozinka"
          type="password"
          value={password}
          onChange={e =>
            setPassword(
              e.target.value
            )
          }
          style={{
            width: '100%',
            padding: '10px'
          }}
        />

        <br />
        <br />

        <button
          onClick={login}
          style={{
            padding:
              '10px 20px'
          }}
        >
          Login
        </button>

        <p>{message}</p>
      </div>
    </div>
  )
}

export default App