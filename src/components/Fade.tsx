import type { TransitionStatus } from 'react-transition-group'
import { Transition } from 'react-transition-group'
import React, { useRef } from 'react'

const duration = 300

const defaultStyle = {
  transition: `opacity ${duration}ms ease-in-out`,
  opacity: 0,
}

const transitionStyles: Record<TransitionStatus, { opacity: number }> = {
  entering: { opacity: 1 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 },
  unmounted: { opacity: 0 },
}

export const Fade: React.FC<{ in: boolean, children: React.ReactNode }> = (props) => {
  const nodeRef = useRef(null)
  return (
    <Transition nodeRef={nodeRef} in={props.in} timeout={duration}>
      {state => (
        <div
          ref={nodeRef}
          style={{
            ...defaultStyle,
            ...transitionStyles[state],
          }}
        >
          { props.children }
        </div>
      )}
    </Transition>
  )
}
