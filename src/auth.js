// Static sign-in for the POC: one fixed account. The session lives in
// sessionStorage, so it survives a normal refresh but ends with the tab,
// on Log out, or on a hard refresh (see below).
const USERNAME = 'ADMIN'
const PASSWORD = 'GE@02VERNOVA'
const SESSION_KEY = 'aviation-explorer-session'
const REMEMBER_KEY = 'aviation-explorer-username'

export const isSignedIn = () => sessionStorage.getItem(SESSION_KEY) === '1'

export function signIn(username, password) {
  const ok = username.trim() === USERNAME && password === PASSWORD
  if (ok) sessionStorage.setItem(SESSION_KEY, '1')
  return ok
}

export const signOut = () => sessionStorage.removeItem(SESSION_KEY)

// "Remember me" only remembers the username on this device.
export const rememberedUsername = () => localStorage.getItem(REMEMBER_KEY) || ''
export const rememberUsername = (username) =>
  username ? localStorage.setItem(REMEMBER_KEY, username) : localStorage.removeItem(REMEMBER_KEY)

// A hard refresh (Ctrl+Shift+R, Ctrl+F5, Shift+F5, Cmd+Shift+R) signs out
// before the browser reloads, so the page comes back on the sign-in screen.
// A plain refresh (F5, Ctrl+R) keeps the session.
window.addEventListener('keydown', (event) => {
  const hardReload = event.key === 'F5'
    ? event.ctrlKey || event.shiftKey
    : (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'r'
  if (hardReload) signOut()
}, true)
