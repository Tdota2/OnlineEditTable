<template>
    <div
        v-if="editTableData[record.id] && editColumnName == column.dataIndex"
        @keyup.esc="cancel(record.id)"
    >
        <a-input
            v-if="editType == 'Input'"
            v-model:value="editTableData[record.id][column.dataIndex]"
            @pressEnter="save(record.id)"
            @keyup.esc="cancel(record.id)"
            v-focus
            style="width: 90%"
        />
        <a-input-number
            v-else-if="editType == 'InputNumber'"
            v-model:value="editTableData[record.id][column.dataIndex]"
            autofocus
            :max="options.max"
            :min="options.min"
            :formatter="options.formatter"
            :precision="options.precision"
            :step="options.step"
            @pressEnter="save(record.id)"
            @keyup.esc="cancel(record.id)"
            style="width: 90%"
        ></a-input-number>
        <a-textarea
            v-else-if="editType == 'Textarea'"
            v-model:value="editTableData[record.id][column.dataIndex]"
            v-focus
            allowClear
            autosize
            :showCount="options.showCount"
            @pressEnter="save(record.id)"
            @keyup.esc="cancel(record.id)"
            style="width: 90%"
        ></a-textarea>
        <a-select
            v-else-if="editType == 'Select'"
            allowClear
            :options="selectDataSource"
            :placeholder="options.placeholder"
            style="width: 90%"
            autofocus
            v-model:value="editTableData[record.id][column.dataIndex].value"
            @select="save(record.id)"
            @keyup.esc="cancel(record.id)"
            :defaultOpen="true"
        >
        </a-select>
        <div v-else-if="editType == 'MutiSelect'">
            <a-select
                allowClear
                mode="multiple"
                :options="selectDataSource"
                :placeholder="options.placeholder"
                style="width: 90%"
                autofocus
                v-model:value="mutiSelectSource"
                @keyup.esc="cancel(record.id)"
                :defaultOpen="true"
                :max-tag-count="0"
            >
            </a-select>
            <a @click="save(record.id)">
                <check-outlined />
            </a>
        </div>
        <a-date-picker
            v-else-if="editType == 'DatePicker'"
            v-model:value="editTableData[record.id][column.dataIndex]"
            :placeholder="options.placeholder ? options.placeholder : ''"
            :disabledDate="options.disabledDate ? options.disabledDate : ''"
            :picker="options.picker ? options.picker : 'date'"
            allowClear
            autofocus
            :open="true"
            :format="options.format ? options.format : 'YYYY-MM-DD'"
            :showTime="options.showTime ? options.showTime : false"
            :showNow="options.showNow ? options.showNow : true"
            :showToday="options.showToday ? options.showToday : true"
            @change="save(record.id)"
            @keyup.esc="cancel(record.id)"
            style="width: 90%"
        ></a-date-picker>
        <a-range-picker
            v-else-if="editType == 'RangePicker'"
            v-model:value="editTableData[record.id][column.dataIndex]"
            allowEmpty
            autofocus
            :open="true"
            allowClear
            :picker="options.picker ? options.picker : 'date'"
            :format="options.format ? options.format : 'YYYY-MM-DD'"
            :showTime="options.showTime ? options.showTime : false"
            @change="save(record.id)"
            @keyup.esc="cancel(record.id)"
            style="width: 90%"
        ></a-range-picker>
    </div>
    <template v-else>
        <div
            :style="{
                width: `${90 - (record.level - 1) * 5}%`,
                cursor: 'pointer',
                display: 'inline-block',
                height: '32px',
                padding: '5px',
            }"
            @click="edit(record.id)"
            v-if="canEdit"
        >
            <div v-if="hasNormalSlot" @click="clickCustom">
                <slot></slot>
            </div>
            <div v-else-if="showText">
                {{ showText }}
            </div>
            <div
                v-else-if="column.type == 'Checkbox'"
                style="text-align: center"
            >
                <check-circle-two-tone
                    two-tone-color="#52c41a"
                    v-if="record[column.dataIndex]"
                    style="font-size: 16px"
                />
                <IconFont
                    type="no-delay"
                    v-else
                    class="pp-operable-icon"
                ></IconFont>
            </div>
            <div
                v-else
                class="editable-cell-icon"
                :style="{ 'text-align': column.align ?? 'left' }"
            >
                <calendar-outlined
                    v-if="['DatePicker', 'RangePicker'].includes(editType)"
                />
                <edit-outlined v-else />
            </div>
        </div>
        <span v-else>
            <span v-if="hasNormalSlot" @click="clickCustom">
                <slot></slot>
            </span>
            <span v-else>{{ showText }} </span></span
        >
        <plus-outlined
            v-if="canSub && column.isTree && canEdit"
            class="sub-cell-icon"
            @click="subItem"
        />
    </template>
</template>

<script lang="ts">
import { computed, Ref, inject, defineComponent, ref, PropType } from "vue";
import type { SelectProps } from "ant-design-vue";
import dayjs from "dayjs";
import IconFont from "../IconFont/Index.vue";
import { DataItem, ColumnType } from "./module/Interface";

export default defineComponent({
    props: {
        //行数据
        record: {
            type: Object,
            default: {},
        },
        //列数据
        column: {
            type: Object as PropType<ColumnType>,
            default: {},
        },
        //能否编辑
        canEdit: {
            type: Boolean,
            default: true,
        },
        //正在编辑的行数据
        editTableData: {
            type: Object,
            default: {},
        },
        //正在编辑的列dataIndex
        editColumnName: {
            type: String,
            default: "",
        },
        //可分解
        canSub: {
            type: Boolean,
            default: true,
        },
    },
    emits: [
        "updateDataSource", //编辑完成更新数据
        "changeEditTableData", //记录当前正在编辑的行
        "changeEditColumnName", //记录当前正在编辑的列dataIndex
        "addSub", //开始分解
        "saveEditItemOldData", //记录编辑前数据
        "clickCustom", //formaterJSX点击事件
        "initSelectSource", //获取下拉数据源
    ],
    setup(props, ctx) {
        //#region   参数
        //在线编辑列及数据
        const dataTable: Ref<DataItem[]> = inject("dataTable") ?? ref([]);
        const columns = inject("columns") ?? ref([]);
        const columnDataIndex = props.column.dataIndex;
        const dataRecord = computed(() => props.record[columnDataIndex]);
        //编辑类型
        const editType = computed(() => props.column.type);
        //下拉、选择组件等额外配置参数
        const options = props.column.options ? props.column.options : {};
        //仅存于当前单元格内的参数数据，与其他单元格隔离
        const editCellData = ref(props.editTableData);
        const editCellName = ref(props.editColumnName);
        //多选下拉的选中数据
        const mutiSelectSource = ref([]);
        //下拉数据源
        const selectDataSource = ref<SelectProps["options"]>([]);
        //判断是否有插槽内容
        const hasNormalSlot = computed(
            () => typeof ctx.slots.default?.()[0].type !== "symbol"
        );
        //可见性
        const visible = reactive({
            SelectCommon: false,
            SelectUser: false,
            SelectDepartment: false,
        });
        //#endregion

        //#region   点击编辑
        //初始化格式数据
        const initData = (editItem: any) => {
            //对时间格式进行处理，antd3.0改为识别dayjs类型
            if (editType.value == "DatePicker") {
                editItem[columnDataIndex] = editItem[columnDataIndex]
                    ? dayjs(editItem[columnDataIndex])
                    : "";
            } else if (editType.value == "RangePicker") {
                if (
                    editItem[columnDataIndex] &&
                    editItem[columnDataIndex].length
                ) {
                    editItem[columnDataIndex] = [
                        dayjs(editItem[columnDataIndex][0]),
                        dayjs(editItem[columnDataIndex][1]),
                    ];
                }
            }
        };
        //点击编辑方法
        const edit = (id: string | number) => {
            let editItem = ref({});
            if (editType.value == "Select" || editType.value == "MutiSelect") {
                //下拉框数据源处理
                ctx.emit("initSelectSource", (result: Array<object>) => {
                    selectDataSource.value = result;
                });
            }
            if (editType.value == "MutiSelect") {
                //多选默认值不能为null，会出现一个空标签
                mutiSelectSource.value =
                    dataRecord.value?.map((item: any) => item.value) ?? [];
            }
            let findItem = (arr: DataItem[]) => {
                //递归查找编辑行
                let arrData = JSON.parse(JSON.stringify(arr));
                arrData.forEach((item: any) => {
                    if (item.id === id) {
                        editItem = item;
                    } else {
                        if (item.children && item.children.length) {
                            findItem(item.children);
                        }
                    }
                });
            };
            findItem(dataTable.value);
            initData(editItem);
            ctx.emit("saveEditItemOldData", editItem);
            editCellData.value[id] = editItem;
            editCellName.value = columnDataIndex;
            emitEditData();
            if (props.column.type == "Checkbox") {
                //复选直接进行保存
                save(id);
            }
        };
        //#endregion

        //#region   修改完成
        //单元格保存方法
        const save = async (id: string | number) => {
            changeData(id); //处理不同类型数据格式
            let assignItem = (arr: DataItem[]) => {
                //递归查找覆盖
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].id === id) {
                        Object.assign(arr[i], props.editTableData[id]);
                    } else {
                        if (arr[i].children && arr[i].children.length) {
                            assignItem(arr[i].children);
                        }
                    }
                }
            };
            assignItem(dataTable.value);
            await ctx.emit(
                "updateDataSource",
                id,
                props.column,
                props.editTableData[id][columnDataIndex]
            );
            delete editCellData.value[id];
            editCellName.value = "";
            emitEditData();
        };
        //处理格式化数据用于保存
        const changeData = (id: string | number) => {
            let value_changed = props.editTableData[id][columnDataIndex];
            switch (editType.value) {
                case "Select":
                    let selectdedItem = selectDataSource.value?.filter(
                        (item) => item.value === value_changed.value
                    )[0];
                    props.editTableData[id][columnDataIndex] = selectdedItem;
                    break;
                case "MutiSelect":
                    let selectedMutiItem = ref<object[]>([]);
                    mutiSelectSource.value.map((item) => {
                        let itemIndex =
                            selectDataSource.value
                                ?.map((item) => item.value)
                                .indexOf(item) ?? -1;
                        if (~itemIndex) {
                            selectedMutiItem.value.push(
                                selectDataSource.value[itemIndex]
                            );
                        }
                    });
                    props.editTableData[id][columnDataIndex] =
                        selectedMutiItem.value;
                    break;
                case "DatePicker":
                    props.editTableData[id][columnDataIndex] =
                        value_changed.format("YYYY-MM-DD");
                    break;
                case "RangePicker":
                    props.editTableData[id][columnDataIndex] = [
                        value_changed[0].format("YYYY-MM-DD"),
                        value_changed[1].format("YYYY-MM-DD"),
                    ];
                    break;
                case "Checkbox":
                    props.editTableData[id][columnDataIndex] = !value_changed;
                    break;
                default:
                    props.editTableData[id][columnDataIndex] = value_changed;
                    break;
            }
        };
        watch(
            () => mutiSelectSource.value,
            () => {
                changeData(props.record.id);
            }
        );
        //#endregion

        //#region   取消编辑
        //取消编辑方法
        const cancel = (id: string | number) => {
            delete editCellData.value[id];
            editCellName.value = "";
            emitEditData();
        };
        //#endregion

        //#region   展示数据格式化处理
        //计算属性，展示文本
        const showText = computed(() => {
            let textValue = "";
            switch (props.column.type) {
                case "Input":
                    textValue = dataRecord.value;
                    break;
                case "Select":
                    textValue = dataRecord.value?.label ?? "";
                    break;
                case "MutiSelect":
                    textValue =
                        dataRecord.value
                            ?.map((item: any) => item.label)
                            .join(",") ?? "";
                    break;
                case "RangePicker":
                    if (dataRecord.value?.length ?? "") {
                        textValue =
                            dataRecord.value[0] + "~" + dataRecord.value[1];
                    } else {
                        textValue = "";
                    }
                    break;
                case "Checkbox":
                    textValue = "";
                    break;
                default:
                    textValue = dataRecord.value;
            }
            return textValue;
        });
        //#endregion

        //#region   向父组件传递方法
        //反写数据，更新整表的数据，控制某个单元格的编辑状态
        const emitEditData = () => {
            ctx.emit(
                "changeEditTableData",
                editCellData.value,
                props.record.id
            );
            ctx.emit("changeEditColumnName", editCellName.value);
        };
        //分解图标点击
        const subItem = () => {
            ctx.emit("addSub", props.record, props.column);
        };
        //点击自定义属性相应
        const clickCustom = () => {
            ctx.emit("clickCustom");
        };
        //#endregion

        //#region   选择组件
        watch(
            () => [
                visible.SelectCommon,
                visible.SelectUser,
                visible.SelectDepartment,
            ],
            (newValue) => {
                if (!newValue.includes(true)) {
                    cancel(props.record.id);
                }
            }
        );
        //#endregion
        return {
            dataRecord,
            dataTable,
            columns,
            hasNormalSlot,
            options,
            visible,
            mutiSelectSource,
            selectDataSource,
            editType,
            showText,
            edit,
            save,
            cancel,
            subItem,
            editCellData,
            editCellName,
            clickCustom,
        };
    },
    components: { IconFont },
});
</script>
<style>
.pp-operable-icon .anticon svg {
    width: 16px !important;
    height: 16px !important;
}
</style>
