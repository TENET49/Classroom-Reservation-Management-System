import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import reservationService from '@/service/reservationService'
import { useAuthStore } from '@/stores/useAuthStore'

export const useNotificationStore = defineStore('notification', () => {
  const authStore = useAuthStore()

  const isLoading = ref(false)
  const items = ref([])
  const lastSeenAt = ref(0)

  const userId = computed(() => authStore.user?.id || null)
  const storageKey = computed(() => (userId.value ? `notifications_last_seen_at_${userId.value}` : 'notifications_last_seen_at'))

  function loadLastSeen() {
    const raw = localStorage.getItem(storageKey.value)
    const n = raw ? parseInt(raw) : 0
    lastSeenAt.value = Number.isFinite(n) ? n : 0
  }

  function saveLastSeen() {
    localStorage.setItem(storageKey.value, String(lastSeenAt.value || 0))
  }

  function latestAudit(row) {
    const a1 = row?.ReservationAudits
    if (Array.isArray(a1) && a1.length > 0) return a1[0]
    const a2 = row?.ReservationAudit
    if (Array.isArray(a2) && a2.length > 0) return a2[0]
    return null
  }

  function statusText(v) {
    if (v === 'pending') return '待审核'
    if (v === 'approved') return '已通过'
    if (v === 'rejected') return '已驳回'
    if (v === 'cancelled') return '已取消'
    return v || '—'
  }

  function buildItems(list) {
    const result = []
    for (const r of list) {
      const audit = latestAudit(r)
      if (!audit) continue
      if (!(r.status === 'approved' || r.status === 'rejected')) continue

      const room = r?.Room?.room_number || '—'
      const ts = r?.TimeSlot
      const timeSlotText =
        ts?.start_time && ts?.end_time ? `${ts.start_time}-${ts.end_time}` : r?.time_slot_id ? `节次${r.time_slot_id}` : '—'
      const baseTitle = `教室 ${room}｜${r.date}｜${timeSlotText}`

      const actionText = audit.action === 'approve' ? '审核通过' : '审核驳回'
      const tagType = audit.action === 'approve' ? 'success' : 'danger'
      const type = audit.action === 'approve' ? 'success' : 'danger'
      const reason = audit.reason || ''
      const t = audit.created_at || r.updated_at || r.created_at
      const time = t ? dayjs(t).valueOf() : 0

      result.push({
        key: `audit-${r.id}-${audit.id}`,
        reservationId: r.id,
        type,
        tagType,
        tagText: actionText,
        title: baseTitle,
        subtitle: `状态：${statusText(r.status)}`,
        reason,
        time,
        timeText: time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '',
      })
    }
    result.sort((a, b) => b.time - a.time)
    return result
  }

  const unreadCount = computed(() => {
    const seen = lastSeenAt.value || 0
    return (items.value || []).filter((x) => (x?.time || 0) > seen).length
  })

  async function refresh() {
    if (!userId.value) {
      items.value = []
      return
    }
    isLoading.value = true
    try {
      const resp = await reservationService.getMyReservations({ userId: userId.value })
      const list = resp?.code === 0 ? resp?.data || [] : []
      items.value = buildItems(list)
    } catch (e) {
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  function markAllRead() {
    lastSeenAt.value = Date.now()
    saveLastSeen()
  }

  watch(userId, () => {
    loadLastSeen()
    refresh()
  }, { immediate: true })

  return {
    isLoading,
    items,
    unreadCount,
    lastSeenAt,
    refresh,
    markAllRead,
  }
})

