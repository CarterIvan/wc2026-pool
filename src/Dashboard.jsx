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
  const [editingMatch, setEditingMatch] = useState(null)
  const [lastMatchPoints, setLastMatchPoints] = useState([])
const [lastMatchName, setLastMatchName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_time')
      for (const match of matchesData || []) {
  if (
    !match.finished &&
    !match.show_predictions &&
    new Date() >= new Date(match.kickoff_time)
  ) {
    await supabase
      .from('matches')
      .update({ show_predictions: true })
      .eq('id', match.id)
  }
}

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

const finishedMatches = (matchesData || [])
  .filter(m => m.finished)
  .sort(
    (a, b) =>
      new Date(b.kickoff_time) -
      new Date(a.kickoff_time)
  )

if (finishedMatches.length > 0) {
  const lastMatch = finishedMatches[0]

  setLastMatchName(
    `${lastMatch.home_team} - ${lastMatch.away_team}`
  )

  const pointsForMatch = (predictionsData || [])
    .filter(p => p.match_id === lastMatch.id)

  setLastMatchPoints(pointsForMatch)
}

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
  const existingPrediction = myPredictions[matchId]
  const match = matches.find(m => m.id === matchId)

if (new Date() >= new Date(match.kickoff_time)) {
  alert('Zapas sa uz hra')
  return
}

  if (existingPrediction && !existingPrediction.edit_used) {
    const { error } = await supabase
      .from('predictions')
      .update({
        predicted_home: Number(tip.home),
        predicted_away: Number(tip.away),
        edit_used: true
      })
      .eq('id', existingPrediction.id)

    if (error) {
      console.log(error)
      alert('Greška')
      return
    }

    setEditingMatch(null)
    loadData()
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
  locked: true,
  edit_used: false
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
  {matches
  .filter(m => !m.finished && m.show_predictions)
  .map(match => (
    <div
  key={match.id}
  style={{
  border: '2px solid #4caf50',
  background: '#dff5df',
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '10px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
}}
>
  <div
  style={{
    color: 'red',
    fontWeight: 'bold',
    marginBottom: '5px'
  }}
>
  🔴 LIVE
</div>
      <h3>
        {match.home_team} - {match.away_team}
      </h3>

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
    </div>
))}
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
  background: 'linear-gradient(135deg, #fffdf7 0%, #f8f3df 100%)',
  border: '1px solid #e6d7a8',
  borderRadius: '14px',
  padding: '12px',
  marginBottom: '10px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  transition: 'all 0.2s ease'
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
  fontWeight: '600',
  fontSize: '13px',
  color: '#5b556e',
  letterSpacing: '0.3px'
}}
>
  {openedHistoryMatch === match.id ? '▼' : '▶'}{' '}
  {match.home_team} - {match.away_team}
</div>


      {openedHistoryMatch === match.id && (
  <div
    style={{
      marginTop: '10px',
      paddingTop: '10px',
      borderTop: '1px solid #e6d7a8'
    }}
  >
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
  </div>
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
    background: 'linear-gradient(135deg, #e2ae13 0%, #b8860b 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(255, 222, 138, 0.25)',
    transition: 'all 0.2s ease'
  }}
>
  📜 Zobraziť ďalších 5
</button>
  </div>
)}

          {matches.map(match => {
            const matchStarted =
  new Date() >=
  new Date(match.kickoff_time)
  const isFinished = match.finished

if (true)
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
    position: 'relative',
    border: '1px solid #ddd',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    background: 'white',
    overflow: 'hidden'
  }}
>
  {!myPredictions[match.id] && (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        right: '-35px',
        transform: 'rotate(45deg)',
        background:
          'linear-gradient(135deg, #d43017, #110bb8)',
        color: 'white',
        padding: '4px 40px',
        fontSize: '9px',
        fontWeight: 'bold',
        boxShadow:
          '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 10
      }}
    >
      NOVÝ ZÁPAS
    </div>
  )}

  <h3>
    {match.home_team} - {match.away_team}
  </h3>

              <p>
                {new Date(
                  match.kickoff_time
                ).toLocaleString()}
              </p>

              {myPredictions[match.id] && editingMatch !== match.id ? (
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
                  <br />

{
 !myPredictions[match.id].edit_used &&
 new Date() < new Date(match.kickoff_time) && (
  <button
  onClick={() => setEditingMatch(match.id)}
  style={{
    marginTop: '10px',
    padding: '8px 16px',
    cursor: 'pointer',
    background: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
  }}
>
  ✏️ 
Upraviť(1) 
</button>
)}
                </div>
              ) : (
                <>
                <input
  type="number"
  min="0"
  placeholder="0"
  onChange={e =>
    updateTip(
      match.id,
      'home',
      e.target.value
    )
  }
  style={{
  width: '55px',
  height: '55px',
  textAlign: 'center',
  fontSize: '22px',
  fontWeight: 'bold',
  border: '2px solid #d8d8d8',
  borderRadius: '12px',
  background: '#fafafa',
  lineHeight: '55px',
  padding: '0',
  boxSizing: 'border-box'
}}
/>

                  {' : '}

                 <input
  type="number"
  min="0"
  placeholder="0"
  onChange={e =>
    updateTip(
      match.id,
      'away',
      e.target.value
    )
  }
  style={{
  width: '55px',
  height: '55px',
  textAlign: 'center',
  fontSize: '22px',
  fontWeight: 'bold',
  border: '2px solid #d8d8d8',
  borderRadius: '12px',
  background: '#fafafa',
  lineHeight: '55px',
  padding: '0',
  boxSizing: 'border-box'
  
}}
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
<div
  style={{
    marginTop: '20px',
    background:
  'linear-gradient(135deg, #f8fbff 0%, #ddeafc 100%)',
border: '1px solid #c5d8f2',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
  }}
>
  <div
    style={{
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '8px'
    }}
  >
    🏆 Posledný zápas
  </div>

  <div
    style={{
      textAlign: 'center',
      fontSize: '12px',
      marginBottom: '10px'
    }}
  >
    {lastMatchName}
  </div>

  {lastMatchPoints
    .sort((a, b) => b.points - a.points)
    .map(p => {
      const pl = players.find(
        x => x.id === p.player_id
      )

      return (
        <div
          key={p.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}
        >
          <span>{pl?.name}</span>
          <span>+{p.points}</span>
        </div>
      )
    })}
</div>
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

                  <div style={{ marginTop: '15px' }}>
  <div
    style={{
      fontSize: '12px',
      textTransform: 'uppercase',
      opacity: 0.7
    }}
  >
    ⚽ Výsledok
  </div>

  <div
    style={{
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '10px'
    }}
  >
    {match.home_score} : {match.away_score}
  </div>

  <div
    style={{
      fontSize: '12px',
      textTransform: 'uppercase',
      opacity: 0.7
    }}
  >
    🎯 Tvoj tip
  </div>

  <div
    style={{
      fontSize: '22px',
      fontWeight: 'bold',
      marginBottom: '10px'
    }}
  >
    {myTip.predicted_home} : {myTip.predicted_away}
  </div>

  <div
    style={{
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#b8860b'
    }}
  >
    🏆 {myTip.points}{' '}
{
  myTip.points === 1
    ? 'bod'
    : myTip.points === 0
    ? 'bodov'
    : 'body'
}
  </div>
</div>
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
      Zobrazit 5
    </button>
  </div>
)}
    </div>
  )
}

export default Dashboard