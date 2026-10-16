<script setup lang="ts">
import { acEnergyLabel } from '@yunlefun-home/air-conditioner-core'

/**
 * 能效标签：点阵与等级条布局来自 core，与 React / Web Component 保持一致。
 */
const dotRows = acEnergyLabel.top
const detailRows = acEnergyLabel.detail
const footerRow = acEnergyLabel.footer
const levels = acEnergyLabel.levels

function dots(num: number) {
  return Array.from({ length: num }, (_, i) => i)
}
</script>

<template>
  <div class="acw-energy-label">
    <!-- 顶部白点 -->
    <div
      v-for="(row, ri) in dotRows"
      :key="`top-${ri}`"
      class="acw-dot-row"
      :style="{ '--acw-dot-color': row.color }"
    >
      <span
        v-for="n in dots(row.num)"
        :key="n"
        class="acw-dot"
        :style="{ width: `${row.size}px`, height: `${row.size}px`, margin: `${row.my}px ${row.mx}px` }"
      />
    </div>

    <!-- 能效等级区 -->
    <div class="acw-energy-grades">
      <div class="acw-energy-arrow">
        <div class="acw-arrow-bar" />
        <div class="acw-arrow-tip" />
        <div class="acw-arrow-bar acw-arrow-bar-sm" />
      </div>
      <div
        v-for="(lv, i) in levels"
        :key="i"
        class="acw-energy-level"
        :style="{ backgroundColor: lv.background, width: lv.width }"
      />
    </div>

    <!-- 文字明细区 -->
    <div class="acw-energy-detail">
      <div
        v-for="(row, ri) in detailRows"
        :key="`detail-${ri}`"
        class="acw-dot-row"
        :style="{ '--acw-dot-color': row.color }"
      >
        <span
          v-for="n in dots(row.num)"
          :key="n"
          class="acw-dot"
          :style="{ width: `${row.size}px`, height: `${row.size}px`, margin: `${row.my}px ${row.mx}px` }"
        />
        <div v-if="ri === 0" class="acw-energy-detail-line" />
      </div>
    </div>

    <!-- 底部白点 -->
    <div class="acw-dot-row" :style="{ '--acw-dot-color': footerRow.color }">
      <span
        v-for="n in dots(footerRow.num)"
        :key="n"
        class="acw-dot"
        :style="{ width: `${footerRow.size}px`, height: `${footerRow.size}px`, margin: `${footerRow.my}px ${footerRow.mx}px` }"
      />
    </div>
  </div>
</template>
