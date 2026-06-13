import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function Dashboard({ player, logout }) {
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [predictions, setPredictions] = useState([])
  const [myPredictions, setMyPredictions] = useState({})
  const [newTips, setNewTips] = useState({})
  const [adminScores, setAdminScores] = useState({})
  const [visibleFinished, setVisibleFinished] =
  useState(5)
  const [visibleHistoryPredictions, setVisibleHistoryPredictions] = useState(5)
  const [openedHistoryMatch, setOpenedHistoryMatch] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_time')

    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .order('points', { ascending: false })

    const { data: predictionsData } = await supabase
      .from('predictions')
      .select('*')

    setMatches(matchesData || [])
    setPlayers(playersData || [])
    setPredictions(predictionsData || [])

    const mine = {}

    ;(predictionsData || []).forEach(p => {
      if (p.player_id === player.id) {
        mine[p.match_id] = p
      }
    })

    setMyPredictions(mine)
  }

  function updateTip(matchId, side, value) {
    setNewTips(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side]: value
      }
    }))
  }

  async function finishMatch(matchId) {
    const score = adminScores[matchId]

    if (
      !score ||
      score.home === undefined ||
      score.away === undefined
    ) {
      alert('Unesi rezultat')
      return
    }

    const { error } = await supabase
      .from('matches')
      .update({
        home_score: Number(score.home),
        away_score: Number(score.away),
        finished: true,
        status: 'finished',
        show_predictions: true
      })
      .eq('id', matchId)

    if (error) {
      console.log(error)
      alert('Greška')
      return
    }

    alert('Utakmica završena')

    loadData()
  }
async function calculatePoints(matchId) {
  const match = matches.find(
    m => m.id === matchId
  )

  if (!match) return

  if (match.points_calculated) {
    alert('Poeni su već obračunati')
    return
  }

  const matchPredictions =
    predictions.filter(
      p => p.match_id === matchId
    )

  for (const prediction of matchPredictions) {
    let points = 0

    const realHome =
      match.home_score

    const realAway =
      match.away_score

    const predHome =
      prediction.predicted_home

    const predAway =
      prediction.predicted_away

    if (
      predHome === realHome &&
      predAway === realAway
    ) {
      points = 3
    } else {
      const realResult =
        realHome > realAway
          ? 'HOME'
          : realHome < realAway
          ? 'AWAY'
          : 'DRAW'

      const predResult =
        predHome > predAway
          ? 'HOME'
          : predHome < predAway
          ? 'AWAY'
          : 'DRAW'

      if (
        realResult === predResult
      ) {
        points = 1
      }
    }

    await supabase
      .from('predictions')
      .update({ points })
      .eq('id', prediction.id)

    const currentPlayer =
      players.find(
        p =>
          p.id ===
          prediction.player_id
      )

    await supabase
      .from('players')
      .update({
        points:
          (currentPlayer?.points || 0) +
          points
      })
      .eq(
        'id',
        prediction.player_id
      )
  }

  await supabase
    .from('matches')
    .update({
      points_calculated: true
    })
    .eq('id', matchId)

  alert('Poeni obračunati')

  loadData()
}
  async function saveTip(matchId) {
    const tip = newTips[matchId]

    if (
      !tip ||
      tip.home === undefined ||
      tip.away === undefined
    ) {
      alert('Unesi oba rezultata')
      return
    }

    const { error } = await supabase
      .from('predictions')
      .insert({
        player_id: player.id,
        match_id: matchId,
        predicted_home: Number(tip.home),
        predicted_away: Number(tip.away),
        points: 0,
        locked: true
      })

    if (error) {
      console.log(error)
      alert('Greška')
      return
    }

    loadData()
  }

  return (
    <div
  style={{
    minHeight: '100vh',
    padding:
      window.innerWidth < 900
        ? '10px'
        : '20px'
  }}
>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}
      >
        <button onClick={logout}>
          Logout
        </button>

        <div>
          Body: {player.points}
        </div>
      </div>

      <h1
        style={{
          textAlign: 'center'
        }}
      >
        WC2026 Tipovanie
      </h1>

      <h2
        style={{
          textAlign: 'center'
        }}
      >
        Vitaj {player.name}
      </h2>

      {player.is_admin && (
        <div
          style={{
            border: '2px solid red',
            padding: '15px',
            marginBottom: '20px'
          }}
        >
          <h3>ADMIN PANEL</h3>

         {matches
  .filter(match => !match.finished)
  .map(match => (
            <div
              key={match.id}
              style={{
                marginBottom: '15px'
              }}
            >
              <b>
                {match.home_team} - {match.away_team}
              </b>

              <br />
              <br />

              <input
                type="number"
                placeholder="Home"
                onChange={e =>
                  setAdminScores(prev => ({
                    ...prev,
                    [match.id]: {
                      ...prev[match.id],
                      home: e.target.value
                    }
                  }))
                }
              />

              {' : '}

              <input
                type="number"
                placeholder="Away"
                onChange={e =>
                  setAdminScores(prev => ({
                    ...prev,
                    [match.id]: {
                      ...prev[match.id],
                      away: e.target.value
                    }
                  }))
                }
              />

              <br />
              <br />

              <button
  onClick={() =>
    finishMatch(match.id)
  }
>
  Završi utakmicu
</button>

{' '}

<button
  onClick={() =>
    calculatePoints(match.id)
  }
>
  Obračunaj poene
</button>

              <hr />
            </div>
          ))}
        </div>
      )}

      <div
  style={{
    display: 'grid',
    gridTemplateColumns:
      window.innerWidth < 900
        ? '1fr'
        : '1fr 2fr 1fr',
    gap: '20px',
    marginTop: '30px'
  }}
>
        <div
  style={{
    background: '#fff9db',
    padding: '15px',
    borderRadius: '12px'
  }}
>
  <h3
    style={{
      textAlign: 'center',
      color: '#b8860b'
    }}
  >
    Predikcie
  </h3>
  <h3
  style={{
    textAlign: 'center',
    color: '#b8860b',
    marginTop: '30px'
  }}
>
  História
</h3>
{matches
  .filter(m => m.finished)
  .reverse()
  .slice(0, visibleHistoryPredictions)
  .map(match => (
    <div
      key={match.id}
      style={{
        border: '1px solid #ccc',
        padding: '10px',
        marginBottom: '10px'
      }}
    >
      <div
  onClick={() =>
    setOpenedHistoryMatch(
      openedHistoryMatch === match.id
        ? null
        : match.id
    )
  }
 style={{
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '10px'
}}
>
  {openedHistoryMatch === match.id ? '▼' : '▶'}{' '}
  {match.home_team} - {match.away_team}
</div>


      {openedHistoryMatch === match.id && (
  <>
    {predictions
      .filter(p => p.match_id === match.id)
      .map(p => {
          const pl = players.find(
            x => x.id === p.player_id
          )

          return (
            <div key={p.id}>
              {pl?.name}: {p.predicted_home}:{p.predicted_away}
            </div>
                 )
        })}
  </>
)}
    </div>
  ))}
  {matches.filter(m => m.finished).length > visibleHistoryPredictions && (
  <div style={{ textAlign: 'center', marginTop: '10px' }}>
    <button
      onClick={() =>
        setVisibleHistoryPredictions(
          visibleHistoryPredictions + 5
        )
      }
      style={{
        padding: '8px 15px',
        cursor: 'pointer'
      }}
    >
      Zobraziť ďalších 5
    </button>
  </div>
)}

          {matches.map(match => {
            const matchStarted =
  new Date() >=
  new Date(match.kickoff_time)
  const isFinished = match.finished

if (!matchStarted || isFinished)
  return null

            return (
              <div
                key={match.id}
                style={{
                  border: '1px solid #ccc',
                  padding: '10px',
                  marginBottom: '10px'
                }}
              >
                <b>
                  {match.home_team} - {match.away_team}
                </b>

                {predictions
                  .filter(
                    p =>
                      p.match_id ===
                      match.id
                  )
                  .map(p => {
                    const pl =
                      players.find(
                        x =>
                          x.id ===
                          p.player_id
                      )

                    return (
                      <div key={p.id}>
                        {pl?.name}:{' '}
                        {p.predicted_home}
                        :
                        {p.predicted_away}
                      </div>
                    )
                  })}
              </div>
            )
          })}
        </div>

        <div>
          <h2
            style={{
              textAlign: 'center'
            }}
          >
            Zapasy
          </h2>

          {matches
  .filter(match => !match.finished)
  .map(match => (
            <div
              key={match.id}
              style={{
  border: '1px solid #ddd',
  padding: '15px',
  marginBottom: '15px',
  borderRadius: '12px',
  boxShadow:
    '0 2px 8px rgba(0,0,0,0.08)',
  background: 'white'
}}
            >
              <h3>
                {match.home_team} - {match.away_team}
              </h3>

              <p>
                {new Date(
                  match.kickoff_time
                ).toLocaleString()}
              </p>

              {myPredictions[
                match.id
              ] ? (
                <div>
                  <b>
                    Tvoj tip:{' '}
                    {
                      myPredictions[
                        match.id
                      ]
                        .predicted_home
                    }
                    :
                    {
                      myPredictions[
                        match.id
                      ]
                        .predicted_away
                    }
                  </b>
                </div>
              ) : (
                <>
                  <input
                    type="number"
                    placeholder="Home"
                    onChange={e =>
                      updateTip(
                        match.id,
                        'home',
                        e.target.value
                      )
                    }
                  />

                  {' : '}

                  <input
                    type="number"
                    placeholder="Away"
                    onChange={e =>
                      updateTip(
                        match.id,
                        'away',
                        e.target.value
                      )
                    }
                  />

                  <br />
                  <br />

                  <button
                    onClick={() =>
                      saveTip(
                        match.id
                      )
                    }
                      style={{
    backgroundColor: '#b8860b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
  }}
                  >
                    Ulozit
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div
  style={{
    background: '#e8f4ff',
    padding: '15px',
    borderRadius: '12px'
  }}
>
  <h3
  style={{
    textAlign: 'center',
    color: '#1565c0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  }}
>
  <span
    style={{
      width: '10px',
      height: '10px',
      backgroundColor: '#ff3b30',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'pulse 1.5s infinite'
    }}
  ></span>

  LIVE Tabulka
</h3>

          {players.map((p, index) => (
            <div
              key={p.id}
              style={{
  background: 'white',
  borderRadius: '8px',
  padding: '10px',
  marginBottom: '8px',
  boxShadow:
    '0 1px 4px rgba(0,0,0,0.08)'
}}
            >
           <>
      {index === 0 && '🥇 '}
      {index === 1 && '🥈 '}
      {index === 2 && '🥉 '}
      {index > 2 && `${index + 1}. `}

      {p.name} — {p.points}
    </>
  </div>
))}
        </div>
      </div>
       <div
          style={{
            marginTop: '50px'
          }}
        >
          <h2>Ukoncene zapasy</h2>

          {[...matches]
  .filter(m => m.finished)
  .reverse()
  .slice(0, visibleFinished)
  .map(match => {
              const myTip =
                myPredictions[match.id]

              if (!myTip) return null

              return (
                <div
                  key={match.id}
                  style={{
                   border: `2px solid ${
  !match.finished
    ? 'orange'
    : myTip.points === 3
    ? 'green'
    : myTip.points === 1
    ? '#d4a017'
    : 'red'
}`,
                    padding: '15px',
                    marginBottom: '15px',
                    background:
  !match.finished
    ? '#fff8d6'
    : myTip.points === 3
    ? '#e8ffe8'
    : myTip.points === 1
    ? '#fff4cc'
    : '#ffe8e8'
                  }}
                >
                  <h3>
                    {match.home_team} -{' '}
                    {match.away_team}
                  </h3>

                  <p>
                    Rezultat:{' '}
                    {match.home_score}:
                    {match.away_score}
                  </p>

                  <p>
                    Tvoj tip:{' '}
                    {myTip.predicted_home}:
                    {myTip.predicted_away}
                  </p>

                  <p>
                    Body: {myTip.points}
                  </p>
                </div>
              )
            })}
        </div>
{matches.filter(m => m.finished).length > visibleFinished && (
  <div style={{ textAlign: 'center', marginTop: '20px' }}>
    <button
      onClick={() => setVisibleFinished(visibleFinished + 5)}
      style={{
        padding: '10px 20px',
        cursor: 'pointer',
        borderRadius: '8px'
      }}
    >
      Prikaži još 5
    </button>
  </div>
)}
    </div>
  )
}

export default Dashboard