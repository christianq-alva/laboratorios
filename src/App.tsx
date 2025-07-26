import { useAuth } from './context/authContext' 
import { Login } from './components/Login/Login'
import { Dashboard } from './components/Dashboard/Dashboard'

function App() {
  const { user } = useAuth()

  return (
    <div>
      {user ? <Dashboard /> : <Login />}
    </div>
  )
}

export default App