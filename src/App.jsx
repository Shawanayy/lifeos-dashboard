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
        <div style={{ flex: '4 1 0%', minWidth: 320 }} className="card">
          <TodoList />
        </div>
        <div style={{ flex: '2.5 1 0%', minWidth: 220 }} className="card">
          <Nutrition />
        </div>
        <div style={{ flex: '3.5 1 0%', minWidth: 280 }} className="card">
          <Workout />
        </div>
      </div>

      <GoalStreaks />

      <WeekCalendar />

      <Finances />

      <Grades />

      <Sleep />
    </div>
  )
}
