<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import GroupForm from "./GroupForm.vue";
import { createGroup } from "../../data/groupStore";

const router = useRouter();

const submitting = ref(false);
const apiError = ref("");

async function handleSubmit(payload) {
  if (submitting.value) return;

  submitting.value = true;
  apiError.value = "";

  try {
    // 실제로는 여기서 POST /api/v1/groups 호출
    await createGroup(payload);

    // 성공 시 그룹 리스트로 이동
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
