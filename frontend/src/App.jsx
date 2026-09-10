import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Landing from
  "./pages/Landing";

import Permission from
  "./pages/Permission";

import Dashboard from
  "./pages/Dashboard";

import ProtectedRoute from
  "./components/ProtectedRoute";


function HomeRoute() {

  const accessToken =
    localStorage.getItem(
      "access"
    );


  if (accessToken) {

    return (
      <Navigate
        to="/permission"
        replace
      />
    );

  }


  return (
    <Landing />
  );

}


export default function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={
            <HomeRoute />
          }
        />


        <Route
          path="/permission"
          element={
            <ProtectedRoute>

              <Permission />

            </ProtectedRoute>
          }
        />


        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>

              <Dashboard />

            </ProtectedRoute>
          }
        />


        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>

  );

}