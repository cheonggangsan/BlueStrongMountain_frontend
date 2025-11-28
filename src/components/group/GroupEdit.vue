<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import GroupForm from "./GroupForm.vue";
import { fetchGroupById, updateGroup } from "../../data/groupStore";

const router = useRouter();
const route = useRoute();

const groupId = route.params.groupId;

const loading = ref(true);
const submitting = ref(false);
const apiError = ref("");

// GroupForm에 넘겨줄 초기값
const initialGroup = ref({
  title: "",
  description: "",
  visibility: "PRIVATE",
  managerIds: [],
  memberIds: [],
});

onMounted(async () => {
  try {
    const group = await fetchGroupById(groupId);

    // ⚠️ 기억용 주석:
    // groupStore 안에서는 name/description/visibility/managerIds/memberIds 구조로 들고 있음.
    initialGroup.value = {
      title: group.name,
      description: group.description || "",
      visibility: group.visibility || "PRIVATE",
      managerIds: group.managerIds || [],
      memberIds: group.memberIds || [],
    };
  } catch (e) {
    console.error(e);
    apiError.value = "그룹 정보를 불러오는 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
  }
});

async function handleSubmit(payload) {
  if (submitting.value) return;

  submitting.value = true;
  apiError.value = "";

  try {
    // 실제로는 PUT /api/v1/groups/{groupId}
    await updateGroup(groupId, payload);

    router.push({ name: "GroupList" });
  } catch (e) {
    console.error(e);
    apiError.value = "스터디 그룹 수정 중 오류가 발생했습니다.";
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  router.back();
}
</script>

<template>
  <div
    v-if="loading"
    class="p-4 max-w-3xl mx-auto text-sm text-gray-500"
  >
    그룹 정보를 불러오는 중입니다...
  </div>

  <GroupForm
    v-else
    mode="edit"
    :initial-group="initialGroup"
    :submitting="submitting"
    :api-error="apiError"
    @submit="handleSubmit"
    @cancel="handleCancel"
  />
</template>
