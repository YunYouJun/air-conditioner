import type { FC } from 'react'

export * from './ac'

export const ComposeContext: FC<{ items: FC[] }> = (props) => {
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
