import { Box, Grid } from '@mui/material'

/**
 * 文本标签（黑色小点点）
 * @param num
 * @param color
 * @param size 宽高尺寸
 * @param mx
 * @param my
 */
function textLabel(
  num: number,
  color: string,
  size: number,
  mx: number,
  my = 0,
) {
  const titleLength = [...new Array(num).keys()]
  const titleLabel = titleLength.map(n => (
    <Box
      key={n}
      mx={mx}
      my={my}
      width={size}
      height={size}
      borderRadius="50%"
      bgcolor={color}
    ></Box>
  ))
  return (
    <Box display="flex" justifyContent="center">
      {titleLabel}
    </Box>
  )
}

/**
 * 功耗标签
 * @param props
 */
export const EnergyLabel: React.FC<{ titleLength: number }> = () => {
  return (
    <Box
      position="absolute"
      top={10}
      left={10}
      height={70}
      width={50}
      borderRadius={1}
      p={0.5}
      style={{
        backgroundColor: '#4ea5f5',
      }}
    >
      {textLabel(6, 'white', 4, 0.25)}
      <Box
        my={0.5}
        px={1}
        py={0.25}
        height={28}
        width="100%"
        bgcolor="background.paper"
      >
        <Grid container>
          <Box bgcolor="green" height={3} width="40%"></Box>
          <Box
            height={3}
            marginLeft="40%"
            style={{
              borderTop: 1.5,
              borderRight: 2,
              borderBottom: 1.5,
              borderLeft: 0,
              borderTopColor: 'transparent',
              borderRightColor: 'green',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              borderStyle: 'solid',
            }}
          ></Box>
          <Box bgcolor="green" height={3} width="10%"></Box>
        </Grid>
        <Box mt={0.25} bgcolor="lightGreen" height={3} width="50%"></Box>
        <Box mt={0.25} bgcolor="#ffc107" height={3} width="60%"></Box>
        <Box mt={0.25} bgcolor="orange" height={3} width="70%"></Box>
        <Box mt={0.25} bgcolor="red" height={3} width="80%"></Box>
      </Box>
      <Box
        mb={0.25}
        pt={0.1}
        height={20}
        width="100%"
        bgcolor="background.paper"
      >
        {textLabel(11, 'black', 2, 0.1, 0.25)}
        <Box my={0.1} borderTop={1} height={0} width="100%"></Box>
        {textLabel(9, 'black', 1.5, 0.1, 0.25)}
        {textLabel(10, 'black', 1.2, 0.1, 0)}
      </Box>
      {textLabel(8, 'white', 2, 0.1)}
    </Box>
  )
}

/**
 * 节能产品惠民工程
 */
export function EnergySavingLabel() {
  return (
    <a
      className="adsense-link"
      href="https://sponsors.yunyoujun.cn"
      target="_blank" rel="noreferrer"
    >
      <div className="energy-saving-label">
        <div className="energy-saving-label_bg">
          <span className="energy-saving-label_title">
            节能产品&nbsp;&nbsp;惠民工程
          </span>
          {/* <img
            className="adsense-logo"
            src="/images/ximalaya-logo.png"
            alt="夏日清凉"
          /> */}
          <span className="adsense-logo" title="夏日清凉">
            💰
          </span>
          <span className="energy-saving-label_description">
            推广上限价格：XXXX 元
          </span>
          <span className="energy-saving-label_description">
            政府补助金额：XXXX 元
          </span>
          <span className="energy-saving-label_description">
            补助上限价格：XXXX 元
          </span>
        </div>
      </div>
    </a>
  )
}
