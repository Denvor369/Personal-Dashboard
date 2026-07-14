<template>
  <main class="dashboard-content-page bank-page">
    <DashboardPageHeader
      eyebrow="Personal finance"
      title="Bank"
      description="Track your ABA balance, cash flow, investments, and money shared with people."
    >
      <template #action>
        <div class="bank-header-actions">
          <AppButton
            variant="ghost"
            :icon-left="balancesHidden ? 'visibility_off' : 'visibility'"
            :aria-pressed="balancesHidden"
            @click="toggleBalances"
          >
            {{ balancesHidden ? 'Show' : 'Hide' }}
          </AppButton>
          <AppButton variant="ghost" icon-left="qr_code_2" @click="qrOpen = true">My QR</AppButton>
          <AppButton variant="ghost" icon-left="tune" @click="openSetup">Set up</AppButton>
          <AppButton variant="dark" icon-left="add" @click="openCreate">Add record</AppButton>
        </div>
      </template>
    </DashboardPageHeader>

    <div class="bank-privacy-note" role="note">
      <q-icon :name="showingDemoData ? 'info' : 'lock_outline'" />
      <span v-if="showingDemoData"><strong>Demo data is showing.</strong> Choose Set up to replace it with your balance and savings goal.</span>
      <span v-else><strong>Manual tracker.</strong> Stored in this browser and not connected to ABA.</span>
    </div>

    <div class="bank-toolbar">
      <nav class="dashboard-pill-nav" aria-label="Bank views">
        <button
          v-for="view in bankViews"
          :key="view.value"
          type="button"
          class="dashboard-pill"
          :class="{ 'dashboard-pill--active': activeView === view.value }"
          :aria-pressed="activeView === view.value"
          @click="activeView = view.value"
        >
          <q-icon :name="view.icon" />{{ view.label }}
        </button>
      </nav>
      <div class="bank-period">
        <nav class="dashboard-pill-nav bank-period__pills" aria-label="Time range">
          <button
            v-for="range_ in periods"
            :key="range_.value"
            type="button"
            class="dashboard-pill"
            :class="{ 'dashboard-pill--active': period === range_.value }"
            :aria-pressed="period === range_.value"
            @click="period = range_.value"
          >
            {{ range_.label }}
          </button>
        </nav>
        <span class="bank-month"><q-icon name="calendar_month" />{{ periodLabel }}</span>
      </div>
    </div>

    <section class="bank-stats" aria-label="Financial overview">
      <AppCard
        v-for="stat in stats"
        :key="stat.label"
        class="bank-stat"
        :class="{ 'bank-stat--safe': stat.highlight }"
        padding="small"
      >
        <span>{{ stat.label }}</span>
        <strong>{{ fmt(stat.value) }}</strong>
        <small>{{ stat.detail }}</small>
        <q-tooltip v-if="stat.highlight">
          Available after upcoming bills and this month's savings target. A personal estimate, not
          advice.
        </q-tooltip>
      </AppCard>
    </section>

    <section v-if="activeView === 'overview'" class="bank-overview workspace-panel">
      <AppCard class="bank-chart-card" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Cash flow</p>
            <h2>Money in and out</h2>
          </div>
          <div class="bank-chart-totals" aria-label="Monthly cash flow totals">
            <span><small>In</small>{{ fmt(flowIn) }}</span>
            <span><small>Out</small>{{ fmt(flowOut) }}</span>
          </div>
        </header>

        <div class="bank-chart" role="group" :aria-label="`${periodLabel} cash flow`">
          <nav class="bank-chart-filters" aria-label="Filter cash flow chart">
            <button
              v-for="filter in chartFilters"
              :key="filter.value"
              type="button"
              :class="{ 'bank-chart-filters__active': chartFilter === filter.value }"
              :aria-pressed="chartFilter === filter.value"
              @click="chartFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </nav>

          <div class="bank-chart__summary">
            <span
              ><small>{{
                chartFilter === 'all' ? 'Month change' : `${activeChartFilter.label} total`
              }}</small
              ><strong :class="chartTotal >= 0 ? 'money-positive' : 'money-warning'"
                >{{ chartTotal >= 0 ? '+' : '−' }}{{ fmt(Math.abs(chartTotal)) }}</strong
              ></span
            >
            <p>
              <q-icon name="show_chart" />{{
                chartFilter === 'all' ? 'Running balance' : `${chartEvents.length} matching records`
              }}
              · each point is one record
            </p>
          </div>

          <div v-if="balanceMarkers.length > 1" class="bank-balance-chart">
            <div class="bank-balance-chart__plot">
              <span class="bank-balance-chart__scale bank-balance-chart__scale--top">{{
                compactMoney(balanceBounds.max)
              }}</span>
              <span class="bank-balance-chart__scale bank-balance-chart__scale--bottom">{{
                compactMoney(balanceBounds.min)
              }}</span>
              <svg
                viewBox="0 0 400 140"
                preserveAspectRatio="none"
                role="img"
                :aria-label="`${periodLabel} ${activeChartFilter.label.toLowerCase()} chart across ${chartEvents.length} records`"
              >
                <defs>
                  <linearGradient id="bank-balance-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="var(--color-primary)" stop-opacity="0.22" />
                    <stop offset="1" stop-color="var(--color-primary)" stop-opacity="0.01" />
                  </linearGradient>
                </defs>
                <line
                  v-for="y in [18, 70, 122]"
                  :key="y"
                  class="bank-balance-chart__grid"
                  x1="0"
                  :y1="y"
                  x2="400"
                  :y2="y"
                />
                <line
                  v-for="x in [80, 160, 240, 320]"
                  :key="x"
                  class="bank-balance-chart__grid"
                  :x1="x"
                  y1="0"
                  :x2="x"
                  y2="140"
                />
                <polygon :points="balanceAreaPoints" fill="url(#bank-balance-fill)" />
                <polyline class="bank-balance-chart__line" :points="balanceLinePoints" />
              </svg>
              <span
                v-for="marker in balanceMarkers"
                :key="marker.id"
                class="bank-balance-chart__point"
                :class="{
                  'bank-balance-chart__point--in': marker.effect > 0,
                  'bank-balance-chart__point--out': marker.effect < 0,
                }"
                :style="{ left: `${(marker.x / 400) * 100}%`, top: `${(marker.y / 140) * 100}%` }"
                role="img"
                tabindex="0"
                :aria-label="`${marker.label}, ${dateLabel(marker.date)}, ${money(marker.balance)}`"
                :title="`${marker.label} · ${dateLabel(marker.date)} · ${money(marker.balance)}`"
              />
            </div>
            <footer>
              <span>{{ dateLabel(range.start) }}</span>
              <strong>{{
                chartFilter === 'all'
                  ? 'Balance after each transaction'
                  : `Cumulative ${activeChartFilter.label.toLowerCase()}`
              }}</strong>
              <span>{{ dateLabel(chartEvents[chartEvents.length - 1]!.date) }}</span>
            </footer>
          </div>
          <p v-else class="bank-empty-copy">Add a money record to start your balance history.</p>
        </div>
      </AppCard>

      <AppCard class="bank-savings-card" variant="dark" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Saving analysis</p>
            <h2>Monthly savings</h2>
          </div>
          <q-icon name="savings" />
        </header>
        <div class="savings-summary">
          <div
            class="savings-ring"
            :style="{ '--savings-angle': `${analytics.savingsRate * 3.6}deg` }"
            role="img"
            :aria-label="`${analytics.savingsRate}% savings rate`"
          >
            <span
              ><strong>{{ analytics.savingsRate }}%</strong><small>saved</small></span
            >
          </div>
          <div class="savings-summary__amount">
            <span>Available after expenses</span>
            <strong>{{ fmt(analytics.available) }}</strong>
            <small>{{ fmt(analytics.invested) }} invested this month</small>
          </div>
        </div>
        <p class="bank-insight"><q-icon name="auto_awesome" />{{ savingsInsight }}</p>
      </AppCard>

      <AppCard class="bank-recent-card" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Latest records</p>
            <h2>Recent activity</h2>
          </div>
          <AppButton size="small" variant="ghost" @click="activeView = 'activity'">
            View all
          </AppButton>
        </header>
        <ul v-if="recentActivity.length" class="bank-recent-list">
          <li v-for="item in recentActivity" :key="item.id" class="bank-recent-item">
            <span class="bank-recent-item__icon" :class="{ 'is-in': item.inflow }">
              <q-icon :name="item.icon" />
            </span>
            <span class="bank-recent-item__body">
              <strong>{{ item.label }}</strong>
              <small>{{ item.kindLabel }}<template v-if="item.person"> · {{ item.person }}</template> · {{ dateLabel(item.date) }}</small>
            </span>
            <span class="bank-recent-item__amount" :class="item.inflow ? 'money-positive' : 'money-warning'">
              {{ item.inflow ? '+' : '−' }}{{ fmt(item.amount) }}
            </span>
          </li>
        </ul>
        <p v-else class="bank-empty-copy">No records in this period yet.</p>
      </AppCard>

      <AppCard class="bank-spending-card" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Expense analysis</p>
            <h2>Where money went</h2>
          </div>
          <strong>{{ fmt(analytics.expenses) }}</strong>
        </header>
        <div v-if="analytics.spending.length" class="spending-breakdown">
          <div v-for="item in analytics.spending" :key="item.label" class="spending-row">
            <span>{{ item.label }}</span
            ><strong>{{ fmt(item.amount) }}</strong>
            <i><span :style="{ width: spendingWidth(item.amount) }" /></i>
          </div>
        </div>
        <p v-else class="bank-empty-copy">No expenses recorded for this period.</p>
      </AppCard>

      <AppCard class="bank-people-card" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Shared money</p>
            <h2>Money with people</h2>
          </div>
          <q-icon name="group" />
        </header>
        <div class="people-summary">
          <section>
            <span>Owed to you</span
            ><strong class="money-positive">{{ fmt(totalReceivable) }}</strong>
            <small>{{ summary.receivables.map(({ name }) => name).join(', ') || 'Nobody' }}</small>
          </section>
          <section>
            <span>You owe</span><strong class="money-warning">{{ fmt(totalPayable) }}</strong>
            <small>{{ summary.payables.map(({ name }) => name).join(', ') || 'No debt' }}</small>
          </section>
        </div>
      </AppCard>

      <AppCard class="bank-investment" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Portfolio</p>
            <h2>Investments</h2>
          </div>
          <q-icon name="trending_up" />
        </header>
        <strong>{{ fmt(summary.invested) }}</strong>
        <p>Total contributions · {{ fmt(analytics.invested) }} added this month.</p>
        <AppProgress
          :value="investmentShare"
          :label="`${investmentShare}% of monthly income invested`"
        />
      </AppCard>
    </section>

    <section v-else-if="activeView === 'coach'" class="bank-coach workspace-panel">
      <!-- Savings goal -->
      <AppCard
        class="bank-coach-goal"
        variant="dark"
        padding="small"
        radius="lg"
        :class="{ 'coach-glow': goalGlow }"
      >
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Savings goal</p>
            <h2><q-icon :name="savingsGoal.icon" /> {{ savingsGoal.name }}</h2>
          </div>
          <AppIconButton icon="edit" label="Edit savings goal" size="small" @click="openGoalEdit" />
        </header>
        <div class="coach-goal__body">
          <div class="coach-goal__ring" :style="{ '--p': savedRatio }" role="img" :aria-label="`${goalPercent}% saved`">
            <strong>{{ goalPercent }}%</strong>
          </div>
          <div class="coach-goal__figures">
            <p><span>Saved</span><strong>{{ fmt(savingsGoal.saved) }}</strong></p>
            <p><span>Target</span><strong>{{ fmt(savingsGoal.target) }}</strong></p>
            <p><span>Remaining</span><strong class="money-warning">{{ fmt(goalRemaining) }}</strong></p>
          </div>
        </div>
        <p class="coach-goal__eta"><q-icon name="schedule" />{{ goalEta }}</p>
        <AppButton size="small" variant="secondary" icon-left="add" @click="addSavingsOpen = true">
          Add to savings
        </AppButton>
      </AppCard>

      <!-- Discipline score + streak -->
      <AppCard class="bank-coach-score" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Money discipline</p>
            <h2>Your score</h2>
          </div>
          <q-icon name="workspace_premium" />
        </header>
        <div class="coach-score__value">
          <strong>{{ score }}</strong><span>/ 100</span>
        </div>
        <AppProgress :value="score" variant="mint" :label="`Discipline score ${score} of 100`" />
        <p class="coach-score__status">{{ scoreStatusText }}</p>
        <div class="coach-streak">
          <div class="coach-streak__flame" :class="{ 'is-lit': streak.current > 0 }">
            <q-icon name="local_fire_department" /><strong>{{ streak.current }}</strong>
          </div>
          <div class="coach-streak__text">
            <p>No-spend streak · best {{ streak.best }}d</p>
            <small>{{ streakMessage }}</small>
          </div>
        </div>
        <p class="coach-insight"><q-icon name="lightbulb" />{{ scoreInsight }}</p>
      </AppCard>

      <!-- Rewards / badges -->
      <AppCard class="bank-coach-badges" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Rewards</p>
            <h2>{{ unlockedCount }}/{{ badges.length }} badges</h2>
          </div>
          <q-icon name="emoji_events" />
        </header>
        <ul class="coach-badge-grid">
          <li
            v-for="badge in badges"
            :key="badge.id"
            class="coach-badge"
            :class="{ 'coach-badge--locked': !badge.unlocked }"
          >
            <span class="coach-badge__icon"><q-icon :name="badge.icon" /></span>
            <span class="coach-badge__name">{{ badge.name }}</span>
            <q-tooltip>{{ badge.description }}{{ badge.unlocked ? ' · unlocked' : ` · ${Math.round(badge.progress * 100)}%` }}</q-tooltip>
          </li>
        </ul>
        <div v-if="nextBadge" class="coach-next">
          <small>Next · {{ nextBadge.name }}</small>
          <AppProgress :value="nextBadge.progress * 100" variant="mint" :label="`Progress to ${nextBadge.name}`" />
        </div>
      </AppCard>

      <!-- Useless spending monitor -->
      <AppCard class="bank-coach-monitor" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Where money leaks</p>
            <h2>Spending by need</h2>
          </div>
          <AppBadge v-if="impulseRising" variant="dark" size="compact">
            <q-icon name="trending_up" /> Rising
          </AppBadge>
        </header>
        <ul class="coach-tier-list">
          <li v-for="row in tierRows" :key="row.value" class="coach-tier">
            <span class="coach-tier__head">
              <span class="coach-tier__label"><q-icon :name="row.icon" />{{ row.label }}</span>
              <strong>{{ fmt(row.amount) }}</strong>
            </span>
            <span class="coach-tier__bar" :class="`coach-tier__bar--${row.value}`">
              <span :style="{ inlineSize: `${Math.round(row.share * 100)}%` }" />
            </span>
          </li>
        </ul>
        <p class="coach-monitor__foot" :class="{ 'is-warn': impulseRising }">
          <q-icon :name="impulseRising ? 'warning' : 'check_circle'" />
          Impulse + optional: {{ fmt(impulseWeek) }} this week · {{ fmt(impulseMonth) }} this month
        </p>
      </AppCard>

      <!-- Challenge + motivation -->
      <AppCard class="bank-coach-challenge" variant="dark" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">This week's challenge</p>
            <h2>{{ challenge.name }}</h2>
          </div>
          <AppBadge :variant="challenge.done ? 'mint' : 'teal'" size="compact">
            {{ challenge.done ? 'On track' : 'Watch it' }}
          </AppBadge>
        </header>
        <div class="coach-challenge__meter">
          <AppProgress
            :value="challenge.percent"
            :variant="challenge.done ? 'mint' : 'dark'"
            :label="`Challenge progress ${challenge.percent}%`"
          />
          <span>{{ fmt(challenge.spent) }} / {{ fmt(challenge.target) }}</span>
        </div>
        <p class="coach-challenge__reward"><q-icon name="redeem" />Reward · {{ challenge.reward }}</p>
        <div class="coach-motivation">
          <p>{{ reminderText }}</p>
          <AppIconButton icon="refresh" label="Next motivation" size="small" @click="nextReminder" />
        </div>
      </AppCard>

      <!-- Think twice -->
      <AppCard class="bank-coach-think" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Pause before buying</p>
            <h2>Think Twice</h2>
          </div>
          <q-icon name="hourglass_top" />
        </header>
        <form class="coach-think__add" @submit.prevent="addThinkTwice">
          <q-input v-model="thinkTwiceDraft.name" dense outlined placeholder="Item" aria-label="Item name" />
          <q-input
            v-model.number="thinkTwiceDraft.price"
            dense
            outlined
            type="number"
            prefix="$"
            placeholder="Price"
            aria-label="Item price"
          />
          <AppIconButton icon="add" label="Add to Think Twice" size="small" @click="addThinkTwice" />
        </form>
        <ul v-if="thinkTwiceSorted.length" class="coach-think__list">
          <li v-for="item in thinkTwiceSorted" :key="item.id" class="coach-think__item">
            <div class="coach-think__info">
              <strong>{{ item.name }}</strong>
              <small>{{ fmt(item.price) }} · {{ waitStatus(item).label }}</small>
            </div>
            <div class="coach-think__actions">
              <AppButton
                v-if="waitStatus(item).ready"
                size="small"
                variant="ghost"
                @click="buyThinkTwice(item)"
              >
                Buy
              </AppButton>
              <AppButton v-else size="small" variant="ghost" @click="keepWaiting(item)">
                Wait
              </AppButton>
              <AppIconButton
                icon="favorite"
                label="Resist and remove"
                size="small"
                @click="removeThinkTwice(item)"
              />
            </div>
          </li>
        </ul>
        <div v-else class="coach-think__empty">
          <q-icon name="spa" />
          <p>Nothing pending. Add anything you're tempted by and pause 24h.</p>
        </div>
      </AppCard>

      <!-- Upcoming bills -->
      <AppCard class="bank-coach-bills" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Coming up</p>
            <h2>Upcoming bills</h2>
          </div>
          <strong class="coach-bills__total">{{ fmt(upcomingBillsTotal) }}</strong>
        </header>
        <ul v-if="upcomingBills.length" class="coach-bills__list">
          <li v-for="bill in upcomingBills" :key="bill.id" class="coach-bill">
            <span class="coach-bill__icon"><q-icon :name="bill.icon" /></span>
            <span class="coach-bill__info">
              <strong>{{ bill.name }}</strong>
              <small>{{ bill.category }} · due day {{ bill.dueDay }}</small>
            </span>
            <span class="coach-bill__meta">
              <strong>{{ fmt(bill.amount) }}</strong>
              <small :class="{ 'is-soon': bill.daysUntil <= 3 }">
                {{ bill.daysUntil === 0 ? 'Due today' : `in ${bill.daysUntil}d` }}
              </small>
            </span>
            <span class="coach-bill__actions">
              <AppButton size="small" variant="ghost" @click="markBillPaid(bill)">Paid</AppButton>
              <AppIconButton
                icon="snooze"
                label="Snooze reminder"
                size="small"
                @click="snoozeBill(bill)"
              />
            </span>
          </li>
        </ul>
        <div v-else class="coach-think__empty">
          <q-icon name="task_alt" />
          <p>All bills are paid. Nicely handled.</p>
        </div>
      </AppCard>
    </section>

    <section v-else class="bank-activity-view workspace-panel">
      <AppCard class="bank-activity" padding="small" radius="lg">
        <header class="bank-section-header">
          <div>
            <p class="dashboard-eyebrow">Transactions</p>
            <h2>Recent activity</h2>
          </div>
          <AppBadge variant="mint" size="compact">{{ records.length }} records</AppBadge>
        </header>

        <div class="workspace-scroll bank-records">
          <article v-for="record in records" :key="record.id" class="bank-record">
            <span class="bank-record__icon"><q-icon :name="kind(record.kind).icon" /></span>
            <div class="bank-record__body">
              <strong>{{ record.label }}</strong>
              <small
                >{{ kind(record.kind).label
                }}<template v-if="record.person"> · {{ record.person }}</template></small
              >
            </div>
            <time :datetime="record.date">{{ dateLabel(record.date) }}</time>
            <strong
              :class="bankBalanceEffect[record.kind] > 0 ? 'money-positive' : 'money-negative'"
            >
              {{ bankBalanceEffect[record.kind] > 0 ? '+' : '−' }}{{ fmt(record.amount) }}
            </strong>
            <AppIconButton
              class="bank-record__delete"
              icon="delete_outline"
              :label="`Delete ${record.label}`"
              @click="removeRecord(record)"
            />
          </article>
        </div>
      </AppCard>
    </section>

    <q-dialog v-model="setupOpen">
      <q-card class="bank-dialog">
        <form @submit.prevent="saveSetup">
          <header>
            <div>
              <p class="dashboard-eyebrow">Your money</p>
              <h2>Set up your numbers</h2>
            </div>
            <AppIconButton icon="close" label="Close" @click="setupOpen = false" />
          </header>

          <label class="workspace-field">
            <span class="workspace-field__label">Current ABA balance (USD)</span>
            <q-input v-model.number="setupDraft.balance" outlined autofocus type="number" step="0.01" prefix="$" />
          </label>

          <label class="workspace-field">
            <span class="workspace-field__label">Savings goal</span>
            <q-input v-model="setupDraft.goalName" outlined placeholder="e.g. Emergency Fund" />
          </label>
          <div class="bank-form-row">
            <label class="workspace-field">
              <span class="workspace-field__label">Goal target (USD)</span>
              <q-input v-model.number="setupDraft.goalTarget" outlined type="number" min="1" step="0.01" prefix="$" />
            </label>
            <label class="workspace-field">
              <span class="workspace-field__label">Already saved (USD)</span>
              <q-input v-model.number="setupDraft.goalSaved" outlined type="number" min="0" step="0.01" prefix="$" />
            </label>
          </div>

          <p class="bank-dialog__hint">
            <template v-if="showingDemoData">Saving removes the example transactions and coach items. Records you added yourself stay.</template>
            <template v-else>Future records will update this balance automatically.</template>
          </p>
          <footer>
            <AppButton variant="ghost" @click="setupOpen = false">Cancel</AppButton>
            <AppButton type="submit" :disabled="!setupValid">Save my numbers</AppButton>
          </footer>
        </form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="createOpen">
      <q-card class="bank-dialog">
        <form @submit.prevent="saveRecord">
          <header>
            <div>
              <p class="dashboard-eyebrow">Manual entry</p>
              <h2>Add money record</h2>
            </div>
            <AppIconButton icon="close" label="Close" @click="createOpen = false" />
          </header>

          <label class="workspace-field">
            <span class="workspace-field__label">Record type</span>
            <q-select
              v-model="draft.kind"
              :options="bankRecordKinds"
              emit-value
              map-options
              outlined
            />
          </label>
          <div v-if="draft.kind === 'expense'" class="workspace-field">
            <span class="workspace-field__label">How necessary was it?</span>
            <div class="bank-tier-picker" role="group" aria-label="Spending tier">
              <button
                v-for="tier in spendTiers"
                :key="tier.value"
                type="button"
                class="bank-tier"
                :class="{ 'bank-tier--active': draft.tier === tier.value }"
                :aria-pressed="draft.tier === tier.value"
                @click="draft.tier = tier.value"
              >
                <q-icon :name="tier.icon" />{{ tier.label }}
                <q-tooltip>{{ tier.hint }}</q-tooltip>
              </button>
            </div>
          </div>
          <div v-if="draftWarning" class="bank-soft-warning" role="status">
            <q-icon name="info" />
            <div>
              <p>{{ draftWarning }}</p>
              <button type="button" class="bank-soft-warning__link" @click="moveDraftToThinkTwice">
                Move to Think Twice instead
              </button>
            </div>
          </div>
          <label class="workspace-field">
            <span class="workspace-field__label">Description</span>
            <q-input
              v-model="draft.label"
              outlined
              autofocus
              placeholder="Salary, groceries, index fund…"
            />
          </label>
          <div class="bank-form-row">
            <label class="workspace-field">
              <span class="workspace-field__label">Amount (USD)</span>
              <q-input
                v-model.number="draft.amount"
                outlined
                type="number"
                min="0.01"
                step="0.01"
                prefix="$"
              />
            </label>
            <label class="workspace-field">
              <span class="workspace-field__label">Date</span>
              <q-input v-model="draft.date" outlined type="date" />
            </label>
          </div>
          <label v-if="needsPerson" class="workspace-field">
            <span class="workspace-field__label">Person</span>
            <q-input v-model="draft.person" outlined placeholder="Who is this money with?" />
          </label>

          <footer>
            <AppButton variant="ghost" @click="createOpen = false">Cancel</AppButton>
            <AppButton type="submit" :disabled="!validDraft">Save record</AppButton>
          </footer>
        </form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="addSavingsOpen">
      <q-card class="bank-dialog">
        <form @submit.prevent="confirmAddSavings">
          <header>
            <div>
              <p class="dashboard-eyebrow">{{ savingsGoal.name }}</p>
              <h2>Add to savings</h2>
            </div>
            <AppIconButton icon="close" label="Close" @click="addSavingsOpen = false" />
          </header>
          <label class="workspace-field">
            <span class="workspace-field__label">Amount (USD)</span>
            <q-input
              v-model.number="savingsInput"
              outlined
              autofocus
              type="number"
              min="0.01"
              step="0.01"
              prefix="$"
            />
          </label>
          <p class="bank-dialog__hint">
            Moves money toward your goal on this device. It does not transfer real funds.
          </p>
          <footer>
            <AppButton variant="ghost" @click="addSavingsOpen = false">Cancel</AppButton>
            <AppButton type="submit" :disabled="!savingsInput || savingsInput <= 0">Add</AppButton>
          </footer>
        </form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="goalEditOpen">
      <q-card class="bank-dialog">
        <form @submit.prevent="saveGoal">
          <header>
            <div>
              <p class="dashboard-eyebrow">Savings goal</p>
              <h2>Edit goal</h2>
            </div>
            <AppIconButton icon="close" label="Close" @click="goalEditOpen = false" />
          </header>
          <div class="coach-goal-presets" role="group" aria-label="Goal presets">
            <button
              v-for="preset in savingsGoalPresets"
              :key="preset.name"
              type="button"
              class="coach-goal-preset"
              :class="{ 'is-active': goalDraft.name === preset.name }"
              @click="applyGoalPreset(preset)"
            >
              <q-icon :name="preset.icon" />{{ preset.name }}
            </button>
          </div>
          <label class="workspace-field">
            <span class="workspace-field__label">Goal name</span>
            <q-input v-model="goalDraft.name" outlined placeholder="e.g. Emergency Fund" />
          </label>
          <div class="bank-form-row">
            <label class="workspace-field">
              <span class="workspace-field__label">Target amount (USD)</span>
              <q-input v-model.number="goalDraft.target" outlined type="number" min="1" prefix="$" />
            </label>
            <label class="workspace-field">
              <span class="workspace-field__label">Saved so far (USD)</span>
              <q-input v-model.number="goalDraft.saved" outlined type="number" min="0" prefix="$" />
            </label>
          </div>
          <p class="bank-dialog__hint">Set your own goal, target, and how much you've saved already.</p>
          <footer>
            <AppButton variant="ghost" @click="goalEditOpen = false">Cancel</AppButton>
            <AppButton type="submit" :disabled="!goalDraftValid">Save goal</AppButton>
          </footer>
        </form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="qrOpen">
      <q-card class="bank-qr-dialog">
        <header>
          <div>
            <p class="dashboard-eyebrow">Receive money</p>
            <h2>My ABA KHQR</h2>
            <p>Let someone scan this code, or save the image to share it.</p>
          </div>
          <AppIconButton icon="close" label="Close QR code" @click="qrOpen = false" />
        </header>
        <img
          src="/images/aba-khqr-chhunsour-seng.jpg"
          alt="ABA KHQR payment code for Chhunsour Seng"
        />
        <footer>
          <span><q-icon name="shield" />Share only with people you trust.</span>
          <AppButton icon-left="download" @click="downloadQr">Save image</AppButton>
        </footer>
      </q-card>
    </q-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppIconButton from '@/components/ui/AppIconButton.vue';
import AppProgress from '@/components/ui/AppProgress.vue';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader.vue';
import {
  analyzeBank,
  bankBalanceEffect,
  bankRecordKinds,
  initialBankRecords,
  isBankRecord,
  openingBalanceForCurrent,
  openingBankBalance,
  spendTiers,
  summarizeBank,
} from '@/data/bank.mock';
import type { BankRecord, BankRecordKind, SpendTier } from '@/data/bank.mock';
import {
  MIN_BALANCE_BUFFER,
  SAVINGS_RESERVE,
  coachBadges,
  computeStreak,
  defaultSavingsGoal,
  disciplineScore,
  reminderMessages,
  roundMoney,
  savingsGoalPresets,
  scoreStatus,
  seedBills,
  seedThinkTwice,
  tierBreakdown,
} from '@/data/coach.mock';
import type { RecurringBill, SavingsGoal, ThinkTwiceItem } from '@/data/coach.mock';

const storageKey = 'personal-dashboard-bank-records-v1';
const settingsStorageKey = 'personal-dashboard-bank-settings-v1';
const coachStorageKey = 'personal-dashboard-bank-coach-v1';
const peopleKinds: BankRecordKind[] = ['lent', 'borrowed', 'debt_received', 'debt_repaid'];
const $q = useQuasar();
const createOpen = ref(false);
const qrOpen = ref(false);
const activeView = ref<'overview' | 'activity' | 'coach'>('overview');
type ChartFilter = 'all' | 'income' | 'expense' | 'investment' | 'people';
const chartFilter = ref<ChartFilter>('all');
const chartFilters: Array<{ label: string; value: ChartFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Money in', value: 'income' },
  { label: 'Spending', value: 'expense' },
  { label: 'Investments', value: 'investment' },
  { label: 'People', value: 'people' },
];
const chartFilterKinds: Record<Exclude<ChartFilter, 'all'>, BankRecordKind[]> = {
  income: ['income', 'borrowed', 'debt_received'],
  expense: ['expense'],
  investment: ['investment'],
  people: ['lent', 'borrowed', 'debt_received', 'debt_repaid'],
};
const bankViews = [
  { value: 'overview' as const, label: 'Overview', icon: 'insights' },
  { value: 'coach' as const, label: 'Coach', icon: 'volunteer_activism' },
  { value: 'activity' as const, label: 'Activity', icon: 'receipt_long' },
];
// ----- time range (day / week / month) -----
type Period = 'day' | 'week' | 'month';
const period = ref<Period>('month');
const periods: Array<{ value: Period; label: string }> = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
function shiftDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return isoDay(d);
}

const range = computed<{ start: string; end: string }>(() => {
  const today = isoDay(new Date());
  if (period.value === 'day') return { start: today, end: today };
  if (period.value === 'week') return { start: shiftDays(today, -6), end: today };
  const m = today.slice(0, 7);
  return { start: `${m}-01`, end: `${m}-31` };
});

const periodLabel = computed(() => {
  const { start, end } = range.value;
  if (period.value === 'day') return `Today · ${date.format(new Date(`${start}T00:00:00`))}`;
  if (period.value === 'week')
    return `${date.format(new Date(`${start}T00:00:00`))} – ${date.format(new Date(`${end}T00:00:00`))}`;
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(`${start}T00:00:00`),
  );
});
const periodDetail = computed(() =>
  period.value === 'day' ? 'Today' : period.value === 'week' ? 'This week' : 'This month',
);

function loadRecords(): BankRecord[] {
  try {
    const saved = localStorage.getItem(storageKey);
    const parsed: unknown = saved ? JSON.parse(saved) : null;
    return Array.isArray(parsed)
      ? parsed.filter(isBankRecord)
      : initialBankRecords.map((record) => ({ ...record }));
  } catch {
    return initialBankRecords.map((record) => ({ ...record }));
  }
}

function loadOpeningBalance() {
  try {
    const saved = localStorage.getItem(settingsStorageKey);
    if (saved === null) return openingBankBalance;
    const parsed = Number(saved);
    return Number.isFinite(parsed) ? parsed : openingBankBalance;
  } catch {
    return openingBankBalance;
  }
}

const records = ref(loadRecords());
const demoRecordIds = new Set(initialBankRecords.map(({ id }) => id));
const showingDemoData = ref(records.value.some(({ id }) => demoRecordIds.has(id)));
const openingBalance = ref(loadOpeningBalance());
const draft = reactive<{
  kind: BankRecordKind;
  label: string;
  amount: number | null;
  date: string;
  person: string;
  tier: SpendTier;
}>({
  kind: 'expense',
  label: '',
  amount: null,
  date: new Date().toISOString().slice(0, 10),
  person: '',
  tier: 'important',
});
const summary = computed(() => summarizeBank(records.value, openingBalance.value, range.value));
const analytics = computed(() => analyzeBank(records.value, range.value));
const stats = computed(() => [
  { label: 'ABA balance', value: summary.value.balance, detail: 'Estimated USD balance' },
  { label: 'Income', value: summary.value.income, detail: periodDetail.value },
  { label: 'Spent', value: summary.value.spending, detail: periodDetail.value },
  { label: 'Safe to spend', value: safeToSpend.value, detail: 'After bills + savings', highlight: true },
  { label: 'Available', value: analytics.value.available, detail: 'After tracked expenses' },
]);
// ===================== SAVINGS COACH =====================
const today = isoDay(new Date());
const weekRange = computed(() => ({ start: shiftDays(today, -6), end: today }));
const monthRange = computed(() => ({ start: `${today.slice(0, 7)}-01`, end: `${today.slice(0, 7)}-31` }));

interface CoachState {
  goal: SavingsGoal;
  thinkTwice: ThinkTwiceItem[];
  bills: RecurringBill[];
  reminderIndex: number;
}
function loadCoach(): CoachState {
  try {
    const raw = localStorage.getItem(coachStorageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CoachState>;
      if (parsed?.goal && Array.isArray(parsed.thinkTwice)) {
        return {
          goal: parsed.goal,
          thinkTwice: parsed.thinkTwice,
          bills: Array.isArray(parsed.bills) ? parsed.bills : seedBills(),
          reminderIndex: parsed.reminderIndex ?? 0,
        };
      }
    }
  } catch {
    // fall through to defaults
  }
  return {
    goal: { ...defaultSavingsGoal },
    thinkTwice: seedThinkTwice(Date.now()),
    bills: seedBills(),
    reminderIndex: 0,
  };
}
const coachDataWasSaved = (() => {
  try {
    return localStorage.getItem(coachStorageKey) !== null;
  } catch {
    return false;
  }
})();
const coachInit = loadCoach();
const savingsGoal = reactive<SavingsGoal>(coachInit.goal);
const thinkTwice = ref<ThinkTwiceItem[]>(coachInit.thinkTwice);
const bills = ref<RecurringBill[]>(coachInit.bills);
const reminderIndex = ref(coachInit.reminderIndex);

// ----- privacy: hide sensitive amounts when others may be looking -----
const privacyKey = 'personal-dashboard-bank-privacy';
const balancesHidden = ref(localStorage.getItem(privacyKey) === 'on');
function toggleBalances() {
  balancesHidden.value = !balancesHidden.value;
  localStorage.setItem(privacyKey, balancesHidden.value ? 'on' : 'off');
}
// Money formatter that respects privacy mode. Use for every displayed amount.
function fmt(value: number) {
  return balancesHidden.value ? '••••' : money(value);
}
function persistCoach() {
  try {
    localStorage.setItem(
      coachStorageKey,
      JSON.stringify({
        goal: savingsGoal,
        thinkTwice: thinkTwice.value,
        bills: bills.value,
        reminderIndex: reminderIndex.value,
      }),
    );
  } catch {
    // ignore quota / privacy-mode failures
  }
}

const setupOpen = ref(false);
const setupDraft = reactive<{
  balance: number | null;
  goalName: string;
  goalTarget: number | null;
  goalSaved: number | null;
}>({ balance: null, goalName: '', goalTarget: null, goalSaved: null });
const setupValid = computed(
  () =>
    setupDraft.balance !== null &&
    Number.isFinite(setupDraft.balance) &&
    setupDraft.goalName.trim() !== '' &&
    setupDraft.goalTarget !== null &&
    setupDraft.goalTarget > 0 &&
    setupDraft.goalSaved !== null &&
    setupDraft.goalSaved >= 0,
);
function openSetup() {
  Object.assign(setupDraft, {
    balance: summary.value.balance,
    goalName: savingsGoal.name,
    goalTarget: savingsGoal.target,
    goalSaved: savingsGoal.saved,
  });
  setupOpen.value = true;
}
function saveSetup() {
  if (!setupValid.value || setupDraft.balance === null || setupDraft.goalTarget === null || setupDraft.goalSaved === null) return;

  if (showingDemoData.value) {
    records.value = records.value.filter(({ id }) => !demoRecordIds.has(id));
    if (!coachDataWasSaved) {
      thinkTwice.value = [];
      bills.value = [];
    }
    showingDemoData.value = false;
    persist();
  }

  openingBalance.value = openingBalanceForCurrent(records.value, setupDraft.balance);
  localStorage.setItem(settingsStorageKey, String(openingBalance.value));
  savingsGoal.name = setupDraft.goalName.trim();
  savingsGoal.target = roundMoney(setupDraft.goalTarget);
  savingsGoal.saved = roundMoney(setupDraft.goalSaved);
  persistCoach();
  setupOpen.value = false;
  $q.notify({ type: 'positive', message: 'Your bank numbers are ready', timeout: 1600 });
}

const savedRatio = computed(() =>
  savingsGoal.target > 0 ? Math.min(1, savingsGoal.saved / savingsGoal.target) : 0,
);
const goalRemaining = computed(() => Math.max(0, roundMoney(savingsGoal.target - savingsGoal.saved)));
const goalPercent = computed(() => Math.round(savedRatio.value * 100));
const goalEta = computed(() => {
  if (goalRemaining.value <= 0) return 'Goal reached — time to celebrate!';
  const perWeek = 40; // gentle assumed pace
  const weeks = Math.ceil(goalRemaining.value / perWeek);
  return `About ${weeks} week${weeks === 1 ? '' : 's'} away at ${money(perWeek)}/week.`;
});

const monthTiers = computed(() => tierBreakdown(records.value, monthRange.value));
const monthExpense = computed(() => Object.values(monthTiers.value).reduce((a, b) => a + b, 0));
const impulseMonth = computed(() => roundMoney(monthTiers.value.impulse + monthTiers.value.optional));
const impulseWeek = computed(() => {
  const t = tierBreakdown(records.value, weekRange.value);
  return roundMoney(t.impulse + t.optional);
});
const impulseRising = computed(() => impulseWeek.value > impulseMonth.value / 4 + 0.01);
const impulseShare = computed(() =>
  monthExpense.value > 0 ? impulseMonth.value / monthExpense.value : 0,
);
const tierRows = computed(() =>
  spendTiers.map((tier) => ({
    ...tier,
    amount: monthTiers.value[tier.value],
    share: monthExpense.value > 0 ? monthTiers.value[tier.value] / monthExpense.value : 0,
  })),
);

const streak = computed(() => computeStreak(records.value, today));
const trackedDays = computed(
  () => new Set(records.value.filter((r) => r.date >= monthRange.value.start).map((r) => r.date)).size,
);
const streakMessage = computed(() => {
  const c = streak.value.current;
  if (c === 0) return 'Fresh start — skip one impulse buy to begin a streak.';
  if (c >= streak.value.best && c > 2) return `New best run — ${c} clean days and counting!`;
  return `${c} clean day${c === 1 ? '' : 's'}. Keep protecting it.`;
});

const score = computed(() =>
  disciplineScore({
    savedRatio: savedRatio.value,
    impulseShare: impulseShare.value,
    streak: streak.value.current,
    trackedDays: trackedDays.value,
    surplus: summary.value.net > 0,
  }),
);
const scoreStatusText = computed(() => scoreStatus(score.value));
const scoreInsight = computed(() => {
  if (impulseRising.value) return `Impulse spending is climbing — ${money(impulseWeek.value)} this week.`;
  if (savedRatio.value >= 0.5) return `You're past halfway to ${savingsGoal.name}. Keep going.`;
  if (streak.value.current >= 3) return `${streak.value.current} clean days — momentum is building.`;
  return 'Track spends and protect your streak to lift your score.';
});

const coachStats = computed(() => ({
  savedRatio: savedRatio.value,
  streak: streak.value.current,
  bestStreak: streak.value.best,
  impulseMonth: impulseMonth.value,
  score: score.value,
  trackedDays: trackedDays.value,
}));
const badges = computed(() =>
  coachBadges.map((badge) => {
    const progress = Math.min(1, Math.max(0, badge.progress(coachStats.value)));
    return { ...badge, progress, unlocked: progress >= 1 };
  }),
);
const unlockedCount = computed(() => badges.value.filter((b) => b.unlocked).length);
const nextBadge = computed(
  () =>
    badges.value
      .filter((b) => !b.unlocked)
      .sort((a, b) => b.progress - a.progress)[0] ?? null,
);

const challenge = computed(() => {
  const target = 30;
  const spent = impulseWeek.value;
  return {
    name: 'Keep impulse spends under $30 this week',
    reward: 'Budget Guardian',
    spent,
    target,
    percent: Math.min(100, Math.round((spent / target) * 100)),
    done: spent <= target,
  };
});

const reminderText = computed(() => {
  const dynamic =
    goalRemaining.value > 0
      ? `You are only ${money(goalRemaining.value)} away from ${savingsGoal.name}.`
      : `${savingsGoal.name} is fully funded — set a new goal!`;
  const pool = [dynamic, ...reminderMessages];
  return pool[reminderIndex.value % pool.length]!;
});
function nextReminder() {
  reminderIndex.value = (reminderIndex.value + 1) % (reminderMessages.length + 1);
  persistCoach();
}

const thinkTwiceSorted = computed(() => [...thinkTwice.value].sort((a, b) => b.addedAt - a.addedAt));
function waitStatus(item: ThinkTwiceItem) {
  const hours = (Date.now() - item.addedAt) / 3600_000;
  return hours < 24
    ? { ready: false, label: `${Math.max(1, Math.round(24 - hours))}h pause left` }
    : { ready: true, label: 'Ready to decide' };
}

// ----- celebration -----
const goalGlow = ref(false);
function celebrate(message: string) {
  goalGlow.value = true;
  window.setTimeout(() => {
    goalGlow.value = false;
  }, 1400);
  $q.notify({ type: 'positive', message, timeout: 1800 });
}

// ----- savings + goal actions -----
const addSavingsOpen = ref(false);
const savingsInput = ref<number | null>(null);
function confirmAddSavings() {
  const amount = savingsInput.value;
  if (!amount || amount <= 0) return;
  const before = badges.value.filter((b) => b.unlocked).length;
  savingsGoal.saved = roundMoney(savingsGoal.saved + amount);
  persistCoach();
  addSavingsOpen.value = false;
  savingsInput.value = null;
  celebrate(`Nice! +${money(amount)} toward ${savingsGoal.name}.`);
  if (badges.value.filter((b) => b.unlocked).length > before) {
    $q.notify({ type: 'positive', message: 'Badge unlocked! Check your rewards.', timeout: 2000 });
  }
}

const goalEditOpen = ref(false);
const goalDraft = reactive({ name: '', target: 0, saved: 0, icon: 'savings' });
function openGoalEdit() {
  Object.assign(goalDraft, {
    name: savingsGoal.name,
    target: savingsGoal.target,
    saved: savingsGoal.saved,
    icon: savingsGoal.icon,
  });
  goalEditOpen.value = true;
}
function applyGoalPreset(preset: { name: string; icon: string }) {
  goalDraft.name = preset.name;
  goalDraft.icon = preset.icon;
}
const goalDraftValid = computed(
  () => goalDraft.name.trim() !== '' && goalDraft.target > 0 && goalDraft.saved >= 0,
);
function saveGoal() {
  if (!goalDraftValid.value) return;
  savingsGoal.name = goalDraft.name.trim();
  savingsGoal.target = roundMoney(goalDraft.target);
  savingsGoal.saved = roundMoney(Math.max(0, goalDraft.saved));
  savingsGoal.icon = goalDraft.icon;
  persistCoach();
  goalEditOpen.value = false;
  celebrate('Savings goal updated');
}

// ----- think twice actions -----
const thinkTwiceDraft = reactive<{ name: string; price: number | null }>({ name: '', price: null });
function addThinkTwice() {
  if (!thinkTwiceDraft.name.trim() || !thinkTwiceDraft.price || thinkTwiceDraft.price <= 0) return;
  thinkTwice.value.unshift({
    id: Date.now(),
    name: thinkTwiceDraft.name.trim(),
    price: roundMoney(thinkTwiceDraft.price),
    addedAt: Date.now(),
  });
  persistCoach();
  Object.assign(thinkTwiceDraft, { name: '', price: null });
  $q.notify({ message: 'Added to Think Twice — give it 24 hours.', timeout: 1600 });
}
function buyThinkTwice(item: ThinkTwiceItem) {
  records.value.unshift({
    id: Date.now(),
    kind: 'expense',
    label: item.name,
    amount: item.price,
    date: today,
    tier: 'optional',
  });
  persist();
  thinkTwice.value = thinkTwice.value.filter((i) => i.id !== item.id);
  persistCoach();
  $q.notify({ message: `Logged ${money(item.price)} for ${item.name}.`, timeout: 1600 });
}
function removeThinkTwice(item: ThinkTwiceItem) {
  thinkTwice.value = thinkTwice.value.filter((i) => i.id !== item.id);
  persistCoach();
  celebrate(`Resisted ${item.name} — ${money(item.price)} stays with you.`);
}
function keepWaiting(item: ThinkTwiceItem) {
  const found = thinkTwice.value.find((i) => i.id === item.id);
  if (found) found.addedAt = Date.now();
  persistCoach();
  $q.notify({ message: 'Paused another 24 hours. Future you says thanks.', timeout: 1400 });
}

// ----- smarter add expense -----
const draftIsUnnecessary = computed(
  () => draft.kind === 'expense' && (draft.tier === 'optional' || draft.tier === 'impulse'),
);
const draftWarning = computed(() => {
  if (!draftIsUnnecessary.value) return '';
  if (impulseWeek.value > 0)
    return `You've spent ${money(impulseWeek.value)} on optional buys this week — this may slow ${savingsGoal.name}.`;
  return `This one is optional — it may slow ${savingsGoal.name}.`;
});
function moveDraftToThinkTwice() {
  if (!draft.label.trim() || !draft.amount) return;
  thinkTwice.value.unshift({
    id: Date.now(),
    name: draft.label.trim(),
    price: roundMoney(draft.amount),
    addedAt: Date.now(),
  });
  persistCoach();
  createOpen.value = false;
  $q.notify({ message: 'Saved to Think Twice instead — decide in 24h.', timeout: 1800 });
}

// ----- upcoming bills + safe to spend -----
const todayDayOfMonth = Number(today.slice(-2));
const upcomingBills = computed(() =>
  bills.value
    .filter((bill) => !bill.paid)
    .map((bill) => ({
      ...bill,
      daysUntil: (((bill.dueDay - todayDayOfMonth) % 31) + 31) % 31,
      overdue: bill.dueDay < todayDayOfMonth,
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil),
);
const upcomingBillsTotal = computed(() =>
  roundMoney(upcomingBills.value.reduce((total, bill) => total + bill.amount, 0)),
);
const safeToSpend = computed(() => {
  const reserve = Math.min(SAVINGS_RESERVE, Math.max(0, goalRemaining.value));
  return roundMoney(
    summary.value.balance - upcomingBillsTotal.value - reserve - MIN_BALANCE_BUFFER,
  );
});
function markBillPaid(bill: RecurringBill) {
  const found = bills.value.find((b) => b.id === bill.id);
  if (found) found.paid = true;
  persistCoach();
  celebrate(`${bill.name} marked paid.`);
}
function snoozeBill(bill: RecurringBill) {
  $q.notify({ message: `Reminder for ${bill.name} snoozed.`, timeout: 1400 });
}

const flowIn = computed(() =>
  analytics.value.weeks.reduce((total, week) => total + week.inflow, 0),
);
const flowOut = computed(() =>
  analytics.value.weeks.reduce((total, week) => total + week.outflow, 0),
);
const pulseEvents = computed(() =>
  records.value
    .filter(
      (record) =>
        record.date.slice(0, 10) >= range.value.start &&
        record.date.slice(0, 10) <= range.value.end,
    )
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12),
);
const kindMeta = (kind: BankRecordKind) =>
  bankRecordKinds.find(({ value }) => value === kind) ?? bankRecordKinds[0]!;
// Newest-first records in the selected period, for the right-column feed.
const recentActivity = computed(() =>
  pulseEvents.value
    .slice()
    .reverse()
    .slice(0, 6)
    .map((record) => ({
      ...record,
      icon: kindMeta(record.kind).icon,
      kindLabel: kindMeta(record.kind).label,
      inflow: bankBalanceEffect[record.kind] > 0,
    })),
);
const activeChartFilter = computed(
  () => chartFilters.find(({ value }) => value === chartFilter.value) ?? chartFilters[0]!,
);
const chartEvents = computed(() => {
  const filter = chartFilter.value;
  if (filter === 'all') return pulseEvents.value;
  return pulseEvents.value.filter((record) => chartFilterKinds[filter].includes(record.kind));
});
const chartTotal = computed(() =>
  chartEvents.value.reduce(
    (total, record) => total + record.amount * bankBalanceEffect[record.kind],
    0,
  ),
);
const balanceSeries = computed(() => {
  let balance = chartFilter.value === 'all' ? summary.value.balance - chartTotal.value : 0;
  return [
    {
      id: 'opening',
      label: 'Opening balance',
      date: range.value.start,
      effect: 0,
      balance,
    },
    ...chartEvents.value.map((record) => {
      const effect = bankBalanceEffect[record.kind];
      balance += effect * record.amount;
      return { ...record, effect, balance };
    }),
  ];
});
const balanceBounds = computed(() => {
  const values = balanceSeries.value.map(({ balance }) => balance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(1, (max - min) * 0.12);
  return { min: min - padding, max: max + padding };
});
const balanceMarkers = computed(() => {
  const range = balanceBounds.value.max - balanceBounds.value.min;
  return balanceSeries.value.map((point, index) => ({
    ...point,
    x: 12 + (index / Math.max(1, balanceSeries.value.length - 1)) * 376,
    y: 122 - ((point.balance - balanceBounds.value.min) / range) * 104,
  }));
});
const balanceLinePoints = computed(() =>
  balanceMarkers.value.map(({ x, y }) => `${x},${y}`).join(' '),
);
const balanceAreaPoints = computed(() => `12,132 ${balanceLinePoints.value} 388,132`);
const largestExpense = computed(() => analytics.value.spending[0]?.amount ?? 1);
const totalReceivable = computed(() =>
  summary.value.receivables.reduce((total, { amount }) => total + amount, 0),
);
const totalPayable = computed(() =>
  summary.value.payables.reduce((total, { amount }) => total + amount, 0),
);
const investmentShare = computed(() =>
  analytics.value.income
    ? Math.min(100, Math.round((analytics.value.invested / analytics.value.income) * 100))
    : 0,
);
const savingsInsight = computed(() => {
  if (!analytics.value.income) return 'Add income records to start measuring your savings rate.';
  if (analytics.value.savingsRate >= 30)
    return `Strong month: you kept ${analytics.value.savingsRate}% of tracked income after expenses.`;
  if (analytics.value.savingsRate >= 10)
    return `You kept ${analytics.value.savingsRate}% of income. Review the largest expense to save more.`;
  return 'Expenses are close to income. Focus on one recurring cost before adding new commitments.';
});
const needsPerson = computed(() => peopleKinds.includes(draft.kind));
const validDraft = computed(
  () =>
    Boolean(draft.label.trim() && draft.date && draft.amount && draft.amount > 0) &&
    (!needsPerson.value || Boolean(draft.person.trim())),
);
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function money(value: number) {
  return currency.format(value);
}
function compactMoney(value: number) {
  return compactCurrency.format(value);
}
function dateLabel(value: string) {
  return date.format(new Date(`${value}T00:00:00`));
}
function spendingWidth(value: number) {
  return `${(value / largestExpense.value) * 100}%`;
}
function kind(value: BankRecordKind) {
  return bankRecordKinds.find((option) => option.value === value) ?? bankRecordKinds[0]!;
}
function persist() {
  localStorage.setItem(storageKey, JSON.stringify(records.value));
}
function openCreate() {
  Object.assign(draft, {
    kind: 'expense',
    label: '',
    amount: null,
    date: new Date().toISOString().slice(0, 10),
    person: '',
    tier: 'important',
  });
  createOpen.value = true;
}
function saveRecord() {
  if (!validDraft.value || !draft.amount) return;
  const streakBefore = streak.value.current;
  records.value.unshift({
    id: Date.now(),
    kind: draft.kind,
    label: draft.label.trim(),
    amount: Math.round(draft.amount * 100) / 100,
    date: draft.date,
    ...(needsPerson.value ? { person: draft.person.trim() } : {}),
    ...(draft.kind === 'expense' ? { tier: draft.tier } : {}),
  });
  persist();
  createOpen.value = false;
  if (draftIsUnnecessary.value) {
    $q.notify({
      message: 'Logged. Optional buys add up — your future self is watching kindly.',
      timeout: 1800,
    });
  } else if (draft.kind === 'expense' && streak.value.current > streakBefore) {
    celebrate(`Essential only — ${streak.value.current}-day clean streak intact!`);
  } else {
    $q.notify({ type: 'positive', message: 'Money record saved on this device', timeout: 1400 });
  }
}
function removeRecord(record: BankRecord) {
  if (!window.confirm(`Delete “${record.label}”?`)) return;
  records.value = records.value.filter((item) => item.id !== record.id);
  persist();
  $q.notify({ message: 'Money record deleted', timeout: 1200 });
}
function downloadQr() {
  const link = document.createElement('a');
  link.href = '/images/aba-khqr-chhunsour-seng.jpg';
  link.download = 'ABA-KHQR-Chhunsour-Seng.jpg';
  link.click();
}
</script>

<style scoped lang="scss">
.bank-page {
  min-width: 0;
  // Let the finance dashboard grow and scroll instead of cramming into one
  // viewport — the charts and cards get real, readable height.
  overflow-y: auto;
}
.bank-header-actions,
.bank-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.bank-header-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}
.bank-toolbar {
  justify-content: space-between;
}
.bank-toolbar .dashboard-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.bank-period {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: flex-end;
}
.bank-period__pills .dashboard-pill {
  min-height: 30px;
  padding-inline: var(--space-3);
  font-size: 0.72rem;
}
.bank-month {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.72rem;
}
.bank-privacy-note {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 36px;
  padding: 0 var(--space-3);
  border: var(--border-thin);
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  background: var(--color-surface-raised);
  font-size: 0.78rem;
  font-style: italic;
}
.bank-privacy-note span {
  min-width: 0;
}
.bank-stats {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-2);
}
.bank-stat--safe {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}
.bank-stat--safe strong {
  color: var(--color-primary);
}
.bank-stat {
  display: grid;
  min-width: 0;
  min-height: 76px;
  grid-template-columns: 1fr auto;
  align-items: center;
}
.bank-stat span,
.bank-stat small {
  font-family: var(--font-control);
}
.bank-stat span {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.bank-stat strong {
  grid-row: 1 / 3;
  grid-column: 2;
  font-family: var(--font-heading);
  font-size: clamp(1.25rem, 2vw, 1.8rem);
  font-weight: 700;
  white-space: nowrap;
}
.bank-stat small {
  color: var(--color-text-muted);
  font-size: 0.68rem;
}
.bank-overview {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  // Rows size to content so nothing is clipped; the page scrolls if needed.
  grid-auto-rows: min-content;
  align-items: start;
  gap: var(--space-2);
  overflow: visible;
}
.bank-chart-card {
  // Tall chart on the left; the right column stacks savings + recent activity
  // beside it to fill the height.
  grid-column: span 8;
  grid-row: span 2;
}
.bank-savings-card {
  grid-column: span 4;
}
.bank-recent-card {
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.bank-recent-list {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}
.bank-recent-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
}
.bank-recent-item + .bank-recent-item {
  border-top: 1px solid color-mix(in srgb, var(--color-border) 45%, transparent);
}
.bank-recent-item__icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  color: var(--color-warning);
  background: color-mix(in srgb, var(--color-warning) 16%, transparent);
  font-size: 1rem;
}
.bank-recent-item__icon.is-in {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 16%, transparent);
}
.bank-recent-item__body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.bank-recent-item__body strong {
  overflow: hidden;
  font-family: var(--font-control);
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bank-recent-item__body small {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.66rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bank-recent-item__amount {
  flex-shrink: 0;
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 700;
}

/* ===================== SAVINGS COACH ===================== */
.bank-coach {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: min-content;
  align-items: start;
  gap: var(--space-2);
  overflow-y: auto;
}
.bank-coach-goal {
  grid-column: span 5;
}
.bank-coach-score {
  grid-column: span 4;
}
.bank-coach-badges {
  grid-column: span 3;
}
.bank-coach-monitor {
  grid-column: span 5;
}
.bank-coach-challenge {
  grid-column: span 4;
}
.bank-coach-think {
  grid-column: span 3;
}
.bank-coach-bills {
  grid-column: span 12;
}
.coach-bills__total {
  font-family: var(--font-heading);
  font-size: 1.05rem;
  color: var(--color-warning);
}
.coach-bills__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}
.coach-bill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border: var(--border-thin);
  border-radius: var(--radius-sm);
}
.coach-bill__icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
}
.coach-bill__info {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.coach-bill__info strong {
  font-family: var(--font-control);
  font-size: 0.8rem;
}
.coach-bill__info small {
  color: var(--color-text-muted);
  font-size: 0.64rem;
}
.coach-bill__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}
.coach-bill__meta strong {
  font-family: var(--font-heading);
  font-size: 0.82rem;
}
.coach-bill__meta small {
  font-size: 0.62rem;
  color: var(--color-text-muted);
}
.coach-bill__meta small.is-soon {
  color: var(--color-warning);
  font-weight: 700;
}
.coach-bill__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.bank-coach > .app-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-2);
}
.bank-coach h2 {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 1.05rem;
  font-weight: 700;
}

/* goal */
.coach-goal__body {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.coach-goal__ring {
  position: relative;
  display: grid;
  width: 84px;
  height: 84px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(
    var(--brand-mint) calc(var(--p) * 360deg),
    color-mix(in srgb, currentColor 18%, transparent) 0
  );
}
.coach-goal__ring::after {
  content: '';
  position: absolute;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: var(--color-strong-surface);
}
.coach-goal__ring strong {
  z-index: 1;
  font-family: var(--font-heading);
  font-size: 1.1rem;
}
.coach-goal__figures {
  display: grid;
  flex: 1;
  gap: 2px;
}
.coach-goal__figures p {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}
.coach-goal__figures span {
  font-family: var(--font-control);
  font-size: 0.72rem;
  opacity: 0.75;
}
.coach-goal__figures strong {
  font-family: var(--font-heading);
  font-size: 0.95rem;
}
.coach-goal__eta {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-body);
  font-size: 0.74rem;
  font-style: italic;
  opacity: 0.85;
}

/* score + streak */
.coach-score__value {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}
.coach-score__value strong {
  font-family: var(--font-heading);
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1;
}
.coach-score__value span {
  font-family: var(--font-control);
  font-size: 0.8rem;
  opacity: 0.7;
}
.coach-score__status {
  font-family: var(--font-control);
  font-size: 0.82rem;
  font-weight: 700;
}
.coach-streak {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border: var(--border-thin);
  border-radius: var(--radius-sm);
}
.coach-streak__flame {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--color-text-muted);
  font-family: var(--font-heading);
  font-size: 1.2rem;
}
.coach-streak__flame.is-lit {
  color: var(--color-warning);
}
.coach-streak__text p {
  font-family: var(--font-control);
  font-size: 0.76rem;
  font-weight: 700;
}
.coach-streak__text small {
  color: var(--color-text-muted);
  font-size: 0.68rem;
}
.coach-insight,
.coach-monitor__foot {
  display: flex;
  align-items: flex-start;
  gap: var(--space-1);
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-style: italic;
  opacity: 0.85;
}
.coach-monitor__foot.is-warn {
  color: var(--color-warning);
  font-style: normal;
  opacity: 1;
}

/* badges */
.coach-badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}
.coach-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  text-align: center;
}
.coach-badge__icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  color: var(--color-on-primary);
  background: var(--color-primary);
  font-size: 1.1rem;
}
.coach-badge__name {
  font-family: var(--font-control);
  font-size: 0.58rem;
  line-height: 1.1;
}
.coach-badge--locked .coach-badge__icon {
  color: var(--color-text-muted);
  background: color-mix(in srgb, var(--color-text) 12%, transparent);
}
.coach-badge--locked {
  opacity: 0.7;
}
.coach-next {
  display: grid;
  gap: var(--space-1);
  margin-top: auto;
}
.coach-next small {
  font-family: var(--font-control);
  font-size: 0.68rem;
  color: var(--color-text-muted);
}

/* monitor tiers */
.coach-tier-list {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}
.coach-tier__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}
.coach-tier__label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-control);
  font-size: 0.72rem;
}
.coach-tier__head strong {
  font-family: var(--font-heading);
  font-size: 0.8rem;
}
.coach-tier__bar {
  display: block;
  height: 6px;
  margin-top: 2px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
  overflow: hidden;
}
.coach-tier__bar > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: inline-size var(--duration-slow) var(--ease-smooth-out);
}
.coach-tier__bar--essential > span {
  background: var(--color-primary);
}
.coach-tier__bar--important > span {
  background: var(--color-secondary);
}
.coach-tier__bar--optional > span {
  background: var(--color-warning);
}
.coach-tier__bar--impulse > span {
  background: var(--color-danger);
}

/* challenge + motivation */
.coach-challenge__meter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.coach-challenge__meter span {
  flex-shrink: 0;
  font-family: var(--font-heading);
  font-size: 0.8rem;
}
.coach-challenge__reward {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-control);
  font-size: 0.74rem;
}
.coach-motivation {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: auto;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--brand-mint) 14%, transparent);
}
.coach-motivation p {
  flex: 1;
  font-family: var(--font-body);
  font-size: 0.76rem;
  font-style: italic;
}

/* think twice */
.coach-think__add {
  display: grid;
  grid-template-columns: 1fr 84px auto;
  gap: var(--space-1);
  align-items: center;
}
.coach-think__list {
  display: grid;
  flex: 1;
  gap: var(--space-1);
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}
.coach-think__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border: var(--border-thin);
  border-radius: var(--radius-sm);
}
.coach-think__info {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.coach-think__info strong {
  overflow: hidden;
  font-family: var(--font-control);
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.coach-think__info small {
  color: var(--color-text-muted);
  font-size: 0.66rem;
}
.coach-think__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.coach-think__empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-3);
  text-align: center;
  color: var(--color-text-muted);
}
.coach-think__empty .q-icon {
  font-size: 1.6rem;
}

/* goal presets in dialog */
.coach-goal-presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}
.coach-goal-preset {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 6px var(--space-2);
  border: var(--border-thin);
  border-radius: var(--radius-pill);
  font-family: var(--font-control);
  font-size: 0.72rem;
}
.coach-goal-preset.is-active {
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-color: transparent;
}

/* tier picker in add dialog */
.bank-tier-picker {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-1);
}
.bank-tier {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 38px;
  border: var(--border-thin);
  border-radius: var(--radius-sm);
  font-family: var(--font-control);
  font-size: 0.76rem;
}
.bank-tier--active {
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-color: transparent;
}
.bank-soft-warning {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  padding: var(--space-2);
  border: 1px solid color-mix(in srgb, var(--color-warning) 55%, transparent);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-warning) 12%, transparent);
  color: var(--color-warning);
  font-size: 0.76rem;
}
.bank-soft-warning__link {
  margin-top: 2px;
  color: var(--color-primary);
  font-family: var(--font-control);
  font-size: 0.74rem;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.bank-dialog__hint {
  margin-bottom: var(--space-3);
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-style: italic;
}

/* celebration glow */
.coach-glow {
  animation: coach-glow 1.4s var(--ease-smooth-out);
}
@keyframes coach-glow {
  0%,
  100% {
    box-shadow: var(--shadow-sm);
  }
  40% {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-mint) 60%, transparent);
  }
}
@media (prefers-reduced-motion: reduce) {
  .coach-glow {
    animation: none;
  }
}

.bank-spending-card {
  grid-column: span 5;
}
.bank-people-card {
  grid-column: span 4;
}
.bank-investment {
  grid-column: span 3;
}
.bank-overview > .app-card,
.bank-activity-view,
.bank-activity,
.bank-chart-card {
  min-width: 0;
  min-height: 0;
}
.bank-chart-card,
.bank-savings-card,
.bank-spending-card,
.bank-people-card,
.bank-investment {
  overflow: hidden;
}
.bank-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.bank-section-header h2 {
  font-size: 1.3rem;
  font-weight: 700;
}
.bank-section-header > .q-icon {
  font-size: 1.5rem;
}
.bank-chart-totals {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.bank-chart-totals span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text);
  font-family: var(--font-control);
  font-size: 0.7rem;
  font-weight: 700;
}
.bank-chart-totals small {
  color: var(--color-text-muted);
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
}
.bank-chart-card {
  display: flex;
  flex-direction: column;
}
.bank-chart {
  display: grid;
  flex: 1;
  // filters + summary size to content; the balance chart fills the rest.
  grid-template-rows: auto auto 1fr;
  min-height: 0;
  gap: var(--space-2);
}
.bank-chart-filters {
  display: flex;
  gap: 5px;
  overflow-x: auto;
  scrollbar-width: none;
}
.bank-chart-filters::-webkit-scrollbar {
  display: none;
}
.bank-chart-filters button {
  min-height: 30px;
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  background: var(--color-surface-raised);
  font-family: var(--font-control);
  font-size: 0.62rem;
  white-space: nowrap;
  transition:
    color var(--duration-fast) var(--ease-smooth-out),
    background var(--duration-fast) var(--ease-smooth-out),
    border-color var(--duration-fast) var(--ease-smooth-out);
}
.bank-chart-filters button:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface-soft);
}
.bank-chart-filters button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.bank-chart-filters__active {
  color: var(--color-on-primary) !important;
  border-color: var(--color-primary) !important;
  background: var(--color-primary) !important;
}
.bank-chart__summary {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-primary) 13%, var(--color-surface));
}
.bank-chart__summary > span {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}
.bank-chart__summary small,
.bank-chart__summary p {
  color: var(--color-text-muted);
  font-family: var(--font-control);
}
.bank-chart__summary small {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}
.bank-chart__summary strong {
  font-family: var(--font-heading);
  font-size: clamp(1.15rem, 1.6vw, 1.55rem);
}
.bank-chart__summary p {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 0.62rem;
}
.bank-chart__summary .q-icon {
  color: var(--color-primary);
  font-size: 1rem;
}
.bank-balance-chart {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.bank-balance-chart__plot {
  position: relative;
  flex: 1;
  min-height: clamp(300px, 34vw, 440px);
}
.bank-balance-chart svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.bank-balance-chart__grid {
  stroke: var(--color-border);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.bank-balance-chart__line {
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.bank-balance-chart__point {
  position: absolute;
  z-index: 2;
  width: 10px;
  height: 10px;
  border: 2px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-primary);
  cursor: help;
  transform: translate(-50%, -50%);
}
.bank-balance-chart__point--in {
  background: var(--color-primary);
}
.bank-balance-chart__point--out {
  background: var(--color-warning);
}
.bank-balance-chart__point:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}
.bank-balance-chart__scale {
  position: absolute;
  z-index: 1;
  left: 7px;
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.55rem;
}
.bank-balance-chart__scale--top {
  top: 4px;
}
.bank-balance-chart__scale--bottom {
  bottom: 23px;
}
.bank-balance-chart footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.58rem;
}
.bank-balance-chart footer strong {
  color: var(--color-text-secondary);
}
.bank-savings-card .bank-section-header h2 {
  color: inherit;
}
.savings-summary {
  display: grid;
  grid-template-columns: 112px 1fr;
  align-items: center;
  gap: var(--space-3);
}
.savings-ring {
  display: grid;
  width: 108px;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(
    var(--color-progress-fill) var(--savings-angle),
    color-mix(in srgb, currentColor 16%, transparent) 0
  );
}
.savings-ring > span {
  display: flex;
  width: 78px;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 50%;
  background: var(--color-strong-surface);
}
.savings-ring strong,
.savings-summary__amount > strong {
  font-family: var(--font-heading);
  font-weight: 700;
}
.savings-ring strong {
  font-size: 1.55rem;
  line-height: 1;
}
.savings-ring small,
.savings-summary__amount span,
.savings-summary__amount small {
  font-size: 0.66rem;
}
.savings-summary__amount {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.savings-summary__amount > strong {
  margin-block: 2px;
  font-size: 1.35rem;
}
.savings-summary__amount small {
  opacity: 0.72;
}
.bank-insight {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding: var(--space-2);
  border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, currentColor 8%, transparent);
  font-size: 0.72rem;
  line-height: 1.4;
}
.bank-spending-card .bank-section-header > strong {
  color: var(--color-warning);
  font-family: var(--font-heading);
  font-size: 1.15rem;
}
.spending-breakdown {
  display: grid;
  gap: var(--space-2);
}
.spending-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px var(--space-2);
  font-size: 0.72rem;
}
.spending-row > strong {
  font-family: var(--font-control);
}
.spending-row > i {
  height: 7px;
  grid-column: 1 / -1;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--color-progress-track);
}
.spending-row > i > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-warning);
}
.people-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}
.people-summary section {
  display: flex;
  min-width: 0;
  min-height: 82px;
  justify-content: center;
  flex-direction: column;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-surface-raised);
}
.people-summary span,
.people-summary small {
  color: var(--color-text-muted);
  font-size: 0.66rem;
}
.people-summary strong {
  font-family: var(--font-heading);
  font-size: 1.15rem;
}
.people-summary small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.money-warning {
  color: var(--color-warning);
}
.bank-records {
  border: var(--border-thin);
  border-radius: var(--radius-md);
}
.bank-record {
  display: grid;
  min-height: 58px;
  grid-template-columns: 36px minmax(0, 1fr) 70px 100px 36px;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-bottom: var(--border-thin);
}
.bank-record:last-child {
  border-bottom: 0;
}
.bank-record__icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  color: var(--color-on-primary);
  background: var(--color-primary);
}
.bank-record__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.bank-record__body strong,
.bank-record__body small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bank-record__body small,
.bank-record time {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}
.bank-record time,
.bank-record > strong {
  font-family: var(--font-control);
}
.bank-record > strong {
  font-size: 0.82rem;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
}
.money-positive {
  color: var(--color-primary);
}
.money-negative {
  color: var(--color-text);
}
.bank-empty-copy,
.bank-investment p {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-style: italic;
}
.bank-investment > strong {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
}
.bank-investment :deep(.app-progress) {
  margin-top: var(--space-3);
}
.bank-dialog {
  width: min(560px, calc(100vw - 32px));
  padding: var(--space-4);
  color: var(--color-text);
  background: var(--color-surface);
  border: var(--border-thin);
  border-radius: var(--radius-lg);
}
.bank-dialog header,
.bank-dialog footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.bank-dialog header {
  align-items: flex-start;
  margin-bottom: var(--space-4);
}
.bank-dialog h2 {
  font-size: 1.5rem;
  font-weight: 700;
}
.bank-dialog footer {
  justify-content: flex-end;
}
.bank-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
.bank-qr-dialog {
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  padding: var(--space-4);
  overflow-y: auto;
  color: var(--color-text);
  background: var(--color-surface);
  border: var(--border-thin);
  border-radius: var(--radius-lg);
}
.bank-qr-dialog header,
.bank-qr-dialog footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.bank-qr-dialog header p:last-child {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.76rem;
}
.bank-qr-dialog h2 {
  margin-top: 2px;
  font-size: 1.5rem;
}
.bank-qr-dialog img {
  width: min(100%, 400px);
  max-height: 62dvh;
  margin: var(--space-4) auto;
  object-fit: contain;
  border: var(--border-thin);
  border-radius: var(--radius-md);
}
.bank-qr-dialog footer {
  align-items: center;
}
.bank-qr-dialog footer > span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.68rem;
}
@media (max-width: 1100px) {
  .bank-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .bank-chart-card {
    grid-column: span 7;
  }
  .bank-savings-card,
  .bank-recent-card {
    grid-column: span 5;
  }
  .bank-spending-card,
  .bank-people-card {
    grid-column: span 6;
  }
  .bank-investment {
    display: none;
  }
  .bank-record {
    grid-template-columns: 36px minmax(0, 1fr) 92px 36px;
  }
  .bank-record time {
    display: none;
  }
  .bank-coach-goal,
  .bank-coach-monitor,
  .bank-coach-challenge {
    grid-column: span 6;
  }
  .bank-coach-score,
  .bank-coach-badges,
  .bank-coach-think {
    grid-column: span 6;
  }
}
@media (max-width: 800px) {
  .bank-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .bank-overview,
  .bank-coach {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: none;
    overflow: visible;
  }
  .bank-overview > .app-card,
  .bank-coach > .app-card {
    grid-column: auto;
  }
  .bank-chart-card {
    min-height: 300px;
    grid-row: auto;
  }
  .bank-investment {
    display: block;
  }
}
@media (max-width: 600px) {
  .bank-header-actions {
    width: 100%;
  }
  .bank-header-actions > :deep(.app-btn) {
    flex: 1 1 calc(50% - var(--space-1));
  }
  .bank-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .bank-month {
    padding-inline: var(--space-1);
  }
  .bank-privacy-note {
    align-items: flex-start;
    border-radius: var(--radius-md);
    padding-block: var(--space-2);
  }
  .bank-chart-card {
    min-height: auto;
  }
  .bank-chart-card .bank-section-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .bank-chart {
    gap: var(--space-2);
  }
  .bank-chart__summary {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-1);
  }
  .bank-balance-chart__plot {
    min-height: clamp(220px, 56vw, 300px);
  }
  .bank-balance-chart footer strong {
    display: none;
  }
  .bank-stat {
    display: flex;
    min-height: 82px;
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
  }
  .bank-stat strong {
    order: 2;
    font-size: 1.2rem;
  }
  .bank-stat small {
    order: 3;
  }
  .bank-record {
    grid-template-areas:
      'icon body delete'
      'icon amount delete';
    grid-template-columns: 34px minmax(0, 1fr) 36px;
    gap: var(--space-1);
  }
  .bank-record__icon {
    grid-area: icon;
  }
  .bank-record__body {
    grid-area: body;
  }
  .bank-record > strong {
    grid-area: amount;
    text-align: left;
  }
  .bank-record__delete {
    grid-area: delete;
  }
  .bank-form-row,
  .people-summary {
    grid-template-columns: 1fr;
  }
  .bank-dialog,
  .bank-qr-dialog {
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
  }
  .bank-qr-dialog footer {
    align-items: stretch;
    flex-direction: column;
  }
  .bank-qr-dialog footer > :deep(.app-btn) {
    width: 100%;
  }
}
</style>
