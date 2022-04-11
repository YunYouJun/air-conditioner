import type { FC } from 'react'
import { Suspense, useEffect } from 'react'
import './App.scss'

import { BrowserRouter as Router, useRoutes } from 'react-router-dom'
import pkg from '../package.json'
import Copyright from '~/components/layouts/Copyright'

// @ts-expect-error vite-plugin-pages
import routes from '~react-pages'

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
  // eslint-disable-next-line no-console
  console.log(
    `%c ${emoji} ${name} %c ${link}`,
    `color: white; background: ${color}; padding:5px 0;`,
    `padding:4px;border:1px solid ${color};`,
  )
}

/**
 * Loading Animation
 * @returns
 */
function Loading() {
  return (
    <p className="text-center"><div className="i-mdi-loading animate-spin m-auto text-8xl mt-20" /></p>
  )
}

/**
 * https://github.com/hannoeru/vite-plugin-pages
 * Must use Suspense
 * @returns
 */
function Routes() {
  return (
    <Suspense fallback={<Loading />}>
      {useRoutes(routes)}
    </Suspense>
  )
}

const App: FC = () => {
  useEffect(() => {
    consoleInfo(pkg.name, pkg.repository.url)
    consoleInfo(`@${pkg.author.name}`, pkg.author.url)
  }, [])

  return (
    <main className="p-2">
      <div className="max-w-600px m-auto">
        <Router>
          <Routes />
        </Router>

        <Copyright />
      </div>
    </main>
  )
}

export default App
