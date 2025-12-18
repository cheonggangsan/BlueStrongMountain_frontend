<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import GroupForm from "./GroupForm.vue";
import { createGroup } from "../../data/groupStore";
import { useAuthStore } from "../../data/authStore";

const router = useRouter();
const authStore = useAuthStore();

const submitting = ref(false);
const apiError = ref("");

const currentUserId = computed(() => authStore.user.value?.id ?? null);

async function handleSubmit(payload) {
  if (submitting.value) return;

  submitting.value = true;
  apiError.value = "";

  try {
    const uid = currentUserId.value;
    if (!uid) {
      apiError.value = "로그인 정보가 없어 스터디 그룹을 생성할 수 없습니다.";
      return;
    }

    await createGroup({
      ...payload,
      // managerIds: Array.from(new Set([currentUserId.value, ...payload.managerIds])),
      requesterId: uid,
    });

    router.push({ name: "GroupList" });
  } catch (e) {
    console.error(e);
    apiError.value = "스터디 그룹 생성 중 오류가 발생했습니다.";
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  router.back();
}
</script>

<template>
  <GroupForm
    mode="create"
    :submitting="submitting"
    :api-error="apiError"
    @submit="handleSubmit"
    @cancel="handleCancel"
  />
</template>
