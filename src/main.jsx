import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import './index.css'
import App from './App.jsx'

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  colors: {
    brand: [
      '#e6f3ff',
      '#cce7ff',
      '#99d3ff',
      '#66bfff',
      '#3399ff',
      '#0080ff',
      '#0066cc',
      '#004d99',
      '#003366',
      '#001a33',
    ],
  },
  components: {
    Button: {
      defaultProps: {
        variant: 'filled',
      },
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: true,
      },
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-center" />
      <App />
    </MantineProvider>
  </StrictMode>,
)
