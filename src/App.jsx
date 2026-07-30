import Header from './components/Header.jsx'
import GoalsSeason from './components/GoalsSeason.jsx'
import TodoList from './components/TodoList.jsx'
import Nutrition from './components/Nutrition.jsx'
import Workout from './components/Workout.jsx'
import GoalStreaks from './components/GoalStreaks.jsx'
import WeekCalendar from './components/WeekCalendar.jsx'
import Finances from './components/Finances.jsx'
import Grades from './components/Grades.jsx'
import Sleep from './components/Sleep.jsx'

export default function App() {
  return (
    <div className="page">
      <Header />
      <GoalsSeason />

      <div className="row" style={{ alignItems: 'stretch' }}>
        <div style={{ flex: '5 1 0%', minWidth: 340 }} className="card">
          <TodoList />
        </div>
        <div style={{ flex: '2 1 0%', minWidth: 200 }} className="card">
          <Nutrition />
        </div>
        <div style={{ flex: '3 1 0%', minWidth: 260, alignSelf: 'flex-start' }} className="card" >
          <Workout />
          <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid rgba(236, 228, 216, 0.08)' }}>
            <Sleep bare />
          </div>
        </div>
      </div>

      <WeekCalendar />

      <Finances />

      <GoalStreaks />

      <Grades />
    </div>
  )
}
