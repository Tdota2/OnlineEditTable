<template>
    <a-space>
        <a-button type="primary" @click="canEdit = !canEdit">可编辑</a-button>
        <a-button
            type="primary"
            @click="
                () => {
                    canDrag = !canDrag;
                }
            "
            >拖拽</a-button
        >
    </a-space>
    <online-edit-table
        :columns="columns"
        :dataSource="dataSource"
        :canEdit="canEdit"
        :canDrag="canDrag"
        :canChecked="canChecked"
        :moreOptions="moreOptions"
        :canDelete="true"
        :canInsert="true"
        :canUpOrDownGrade="true"
        v-model:isRefresh="isRefresh"
        objectName="任务"
        baseUrl="projectPlan"
        objectType="Task"
        :params="{
            planId: 'c906881b-1b43-40e0-abb7-fba3ef6a6fda',
            projectId: '07238dec-7c1b-4330-b705-bed588598a72',
        }"
        :scroll="{ y: 'calc(100vh - 150px)' }"
        :cacheMode="true"
        :defaultIndex="0"
        :autoNumber="true"
        @clickMoreOptions="clickMoreOptions"
        @afterSuccess="afterSuccess"
    ></online-edit-table>
</template>
<script setup lang="tsx">
import { ref } from "vue";
import { EditCellType } from "@/componentsBusiness/onlineEditTable/module/Interface";
interface DataItem1 {
    id: string | number;
    sid: number;
    taskName: string;
    milestone: boolean;
    start: string;
    finish: Array<object>;
    start1: object;
    start2: object[] | null;
    project: object[];
    children?: object[];
}
//#region 在线编辑
const canEdit = ref(true);
const canDrag = ref(false);
const canChecked = ref(false);
const isRefresh = ref(false);

const moreOptions = ref([
    {
        id: 1,
        title: "编辑任务详情",
        canShow: true,
        icon: "edit-outlined",
    },
    {
        id: 2,
        title: "查看",
        canShow: true,
        iconFont: "edit",
    },
]);
const clickMoreOptions = (record: DataItem1, menu: object) => {
    debugger;
};
const columns = ref([
    // {
    //     title: "#",
    //     dataIndex: "sid",
    //     autoHeight: true,
    //     width: 50,
    //     type: EditCellType.Input,
    //     canEdit: false,
    // },
    {
        title: "任务名",
        dataIndex: "taskName",
        type: EditCellType.Input,
        resizable: true,
        autoHeight: true,
        isTree: true,
        formaterJSX: (col: object, record: DataItem1) => {
            return <a class="pp-font-red">{record.taskName + "****"}</a>;
        },
    },
    //   {
    //     title: "里程碑",
    //     dataIndex: "milestone",
    //     type: EditCellType.Checkbox,
    //     width: 100,
    //     align: "center",
    //     canEdit: (col: any, record: any) => {
    //       return true;
    //     },
    //   },
    //   {
    //     title: "下拉",
    //     dataIndex: "start1",
    //     type: "Select",
    //     canEdit: true,
    //     width: 200,
    //     options: {
    //       dataSource: (col: object, record: DataItem1) => {
    //         return new Promise((resolve) => {
    //           resolve([
    //             {
    //               value: 0,
    //               label: "1x",
    //             },
    //             {
    //               value: 1,
    //               label: "2x",
    //             },
    //             {
    //               value: 2,
    //               label: "ttq",
    //             },
    //           ]);
    //         });
    //       },
    //       placeholder: "选择CCCCCC",
    //     },
    //   },
    //   {
    //     title: "下拉多选",
    //     dataIndex: "start2",
    //     type: "MutiSelect",
    //     canEdit: true,
    //     width: 200,
    //     options: {
    //       // differentSource: true,
    //       dataSource: (col: object, record: DataItem1) => {
    //         return new Promise((resolve) => {
    //           resolve([
    //             {
    //               value: 0,
    //               label: "1x",
    //             },
    //             {
    //               value: 1,
    //               label: "2x",
    //             },
    //             {
    //               value: 2,
    //               label: "ttq",
    //             },
    //           ]);
    //         });
    //       },
    //       placeholder: "选择CCCCCC",
    //     },
    //   },
    {
        title: "计划开始",
        dataIndex: "start",
        type: "DatePicker",
        canEdit: true,
        width: 200,
    },
    {
        title: "计划结束",
        dataIndex: "finish",
        type: EditCellType.RangePicker,
        autoHeight: true,
        align: "center",
        width: 200,
    },
]);
const dataSource = ref<DataItem1[]>([]);
for (let i = 0; i < 10; i++) {
    dataSource.value.push({
        id: i,
        sid: i,
        taskName: `测试任务${i}`,
        milestone: i % 2 ? true : false,
        start: `2022-${i}`,
        finish: [],
        start1: {},
        start2: [],
        project: [],
    });
}
dataSource.value[0].children = [
    {
        id: "xxxxxxxx",
        sid: 20,
        taskName: `测试子任务1`,
        milestone: false,
        start: `2022-1`,
        finish: [],
        start1: {},
        start2: [],
        project: [],
    },
    {
        id: "xxxxxxxx1",
        sid: 20,
        taskName: `测试子任务2`,
        milestone: false,
        start: `2022-1`,
        finish: [],
        start1: {},
        start2: [],
        project: [],
    },
    {
        id: "xxxxxxxx2",
        sid: 20,
        taskName: `测试子任务3`,
        milestone: false,
        start: `2022-1`,
        finish: [],
        start1: {},
        start2: [],
        project: [],
        children: [
            {
                id: "xxxxxxxx34",
                sid: 20,
                taskName: `测试子任务45`,
                milestone: false,
                start: `2022-2`,
                finish: [],
                start1: {},
                start2: [],
                project: [],
            },
            {
                id: "xxxxxxxx35",
                sid: 20,
                taskName: `测试子任务452`,
                milestone: false,
                start: `2022-2`,
                finish: [],
                start1: {},
                start2: [],
                project: [],
            },
        ],
    },
    {
        id: "xxxxxxxx3",
        sid: 20,
        taskName: `测试子任务4`,
        milestone: false,
        start: `2022-1`,
        finish: [],
        start1: {},
        start2: [],
        project: [],
    },
];
const afterSuccess = (
    type: string,
    col: object,
    record: object,
    dataSource: DataItem1[]
) => {};
//#endregion
</script>
