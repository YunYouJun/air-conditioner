import type { FC } from 'react'
import { lazy, Suspense, useEffect } from 'react'
import Copyright from '~/components/layouts/Copyright'
import pkg from '../package.json'

import './App.scss'

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
 */
function Loading() {
  return (
    <div className="text-center"><div className="i-mdi-loading animate-spin m-auto text-8xl mt-20" /></div>
  )
}

const Home = lazy(() => import('~/pages/index'))
const StandaloneRemote = lazy(() => import('~/pages/Rc'))

/**
 * 只有两个页面：首页和独立遥控器（`/rc`，弹出窗口用）。按路径直接选择，
 * 不必为此引入路由库。
 */
function Page() {
  const path = window.location.pathname.slice(import.meta.env.BASE_URL.length).replace(/\/+$/, '')
  const Current = path.toLowerCase() === 'rc' ? StandaloneRemote : Home
  return (
    <Suspense fallback={<Loading />}>
      <Current />
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
        <Page />

        <Copyright />
      </div>
    </main>
  )
}

export default App
