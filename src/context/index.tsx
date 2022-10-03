import type { PropsWithChildren } from 'react'
import React from 'react'

export * from './ac'

export const ComposeContext: React.FC<PropsWithChildren<{ items: React.FC<PropsWithChildren>[] }>> = (props) => {
  const { items, children } = props
  return (
    <>
      {
        items.reduceRight(
          (acc, Comp) => <Comp>{acc}</Comp>,
          children,
        )
      }
    </>
  )
}

export default ComposeContext
