import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import "./index.css"
import App from "./App.tsx"
import { EditPage } from "./pages/EditPage.tsx"

const router = createBrowserRouter(
  [
    { path: "/", element: <App /> },
    { path: "/edit", element: <EditPage /> },
  ],
  { basename: import.meta.env.BASE_URL }
)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
