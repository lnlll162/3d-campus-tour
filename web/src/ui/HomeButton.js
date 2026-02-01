export const mountHomeButton = ({ onClick, label = '回到首页' } = {}) => {
  const el = document.createElement('button')
  el.className = 'home-fab'
  el.type = 'button'
  el.textContent = label

  el.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onClick) onClick()
  })

  document.body.appendChild(el)

  return () => {
    if (el && el.parentNode) el.parentNode.removeChild(el)
  }
}
