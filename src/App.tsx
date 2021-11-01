import React, { useEffect } from 'react'
import './App.scss'

import { HashRouter as Router, Switch, Route } from 'react-router-dom'
import pkg from '../package.json'
import { AppTheme } from './theme'

import Home from './pages/Home'
import Rc from './pages/Rc'

/**
 * 控制台输出信息
 * @param name 名称
 * @param link 链接
 * @param color 颜色
 * @param emoji
 */
function consoleInfo(
  name: string,
  link: string,
  color = '#0078E7',
  emoji = '☁️',
) {
  console.log(
    `%c ${emoji} ${name} %c ${link}`,
    `color: white; background: ${color}; padding:5px 0;`,
    `padding:4px;border:1px solid ${color};`,
  )
}

const App: React.FC = () => {
  useEffect(() => {
    consoleInfo(pkg.name, pkg.repository.url)
    consoleInfo(`@${pkg.author.name}`, pkg.author.url)
  }, [])

  return (
    <AppTheme>
      <main className="text-gray-700 dark:text-gray-200 p-2">
        <div className="max-w-600px m-auto">
          <Router>
            <Switch>
              <Route path="/rc">
                <Rc />
              </Route>
              <Route path="/">
                <Home />
              </Route>
            </Switch>
          </Router>
        </div>
      </main>
    </AppTheme>
  )
}

export default App
