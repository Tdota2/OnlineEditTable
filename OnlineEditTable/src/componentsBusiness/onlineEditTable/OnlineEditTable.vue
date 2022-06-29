<!-- 
    ★★★★★
    在线编辑参数配置参考：飞书知识库文档——5.0在线编辑使用说明
    列参数配置参考：同文件夹下STable.text
    ★★★★★  
-->
<template>
    <div v-clickOutside="clickOutside">
        <s-table
            id="SOnlineEditTable"
            ref="tableRef"
            rowKey="id"
            bordered
            :key="tableKey"
            :columns="columnsTable"
            :data-source="dataTable"
            v-model:expandedRowKeys="expandedRowKeys"
            :row-selection="canChecked ? rowSelection : null"
            :scroll="scroll"
            :pagination="false"
            :expandIconColumnIndex="expandIconColumnIndex"
            :loading="loading"
            :size="size"
            @expand="expand"
            @row-drag-end="onRowDragEnd"
            :animateRows="true"
        >
            <!-- 拖动行 -->
            <template
                #rowDragGhost="{ record, icon, preTargetInfo, nextTargetInfo }"
            >
                <div v-if="dragTooltip">
                    <component :is="icon"></component>
                    <span style="color: red">
                        将{{ objectName }}:“ {{ record.name }}” 拖动到 “{{
                            preTargetInfo?.record.name ||
                            nextTargetInfo?.record.name
                        }}”
                    </span>
                </div>
            </template>
            <!-- 合计行 -->
            <template #summary v-if="totalRows && totalRows.length">
                <s-table-summary-row>
                    <s-table-summary-cell :index="0">合计</s-table-summary-cell>
                    <s-table-summary-cell
                        v-for="item in totalRows"
                        :index="item"
                    >
                        <template #default="{ total }">
                            <a-typography-text type="danger">{{
                                total
                            }}</a-typography-text>
                        </template>
                    </s-table-summary-cell>
                </s-table-summary-row>
            </template>
        </s-table>
    </div>
    <!-- 新建 -->
    <a-row v-if="canCreate && canEdit" style="margin-top: 5px">
        <a-col :span="24">
            <plus-outlined
                style="margin-right: 2px; font-size: 10px; color: gray"
            />
            <input
                v-focus
                :placeholder="`快速输入${objectName}名称`"
                @keyup.enter="addNew"
                @keyup.esc="cancelNew"
                v-model="createItemValue"
                style="
                    margin-left: 5px;
                    width: 50%;
                    outline: none;
                    border: 1px solid #40a9ff;
                "
            />
            <a class="pp-m-l-sm" @click="addNew">
                <plus-outlined style="font-size: 10px" />
                新建
            </a>
        </a-col>
    </a-row>
</template>
<script lang="tsx">
// vue引入
import {
    computed,
    Ref,
    UnwrapRef,
    provide,
    onMounted,
    defineComponent,
    ref,
    reactive,
    watch,
    getCurrentInstance,
    PropType,
} from "vue";
//antd及STable引入
import type {
    STablePaginationConfig,
    DragRowEventInfo,
    STableProps,
} from "@surely-vue/table";
import TableCell from "./TableCell.vue";
import { Modal } from "ant-design-vue";
import { message } from "ant-design-vue";
//自定义接口或类
import { ColumnType, DataItem } from "./module/Interface";
//自定义组件
import MoreOptions from "./MoreOptions.vue";
import EditInput from "./EditInput.vue";

export default defineComponent({
    components: { TableCell, EditInput, MoreOptions },
    props: {
        //接口地址  对应后端controller
        baseUrl: {
            type: String,
            default: "",
        },
        //数据类型  拼接后对应后端接口名称
        objectType: {
            type: String,
            default: "",
        },
        //数据名称  用于删除等提示信息
        objectName: {
            type: String,
            default: "条目",
        },
        //额外参数  接口传递时参数
        params: {
            type: Object,
            default: {},
        },
        //列    形成表格表头
        columns: {
            type: Array as PropType<ColumnType[]>,
            default: [],
        },
        //数据
        dataSource: {
            type: Array as PropType<DataItem[]>,
            default: [],
        },
        //缓存模式  不进行前后端接口交互，只更新dataSource
        cacheMode: {
            type: Boolean,
            default: false,
        },
        //可编辑    控制整个表格的编辑权限
        canEdit: {
            type: Boolean,
            default: true,
        },
        //可创建    控制表格下方的创建
        canCreate: {
            type: Boolean,
            default: true,
        },
        //可删除    控制“操作”列删除按钮
        canDelete: {
            type: Boolean,
            default: true,
        },
        //可分解    控制树形列的分解按钮
        canSub: {
            type: Boolean,
            default: true,
        },
        //可插入    控制“操作”列插入按钮
        canInsert: {
            type: Boolean,
            default: false,
        },
        //可升降级  控制“操作”列升级、降级按钮
        canUpOrDownGrade: {
            type: Boolean,
            default: false,
        },
        //可拖拽    控制表格拖动列显示
        canDrag: {
            type: Boolean,
            default: false,
        },
        //可复选    控制表格复选框列显示
        canChecked: {
            type: Boolean,
            default: false,
        },
        //拖动提示  控制是否出现行拖动提示
        dragTooltip: {
            type: Boolean,
            default: false,
        },
        //更多菜单  操作列自定义菜单
        moreOptions: {
            type: Array,
            default: [],
        },
        //选中条目  配合canChecked使用
        selectedRowKeys: {
            type: Array,
            default: [],
        },
        //滚动  表格滚动
        scroll: {
            type: Object,
            default: false,
        },
        // ★ 默认第1列为创建列     影响新建、分解等，指定新建信息出现在哪一列，Index表示
        defaultIndex: {
            type: Number,
            default: 0,
        },
        //表格size  表格规模，用于空间不同设置不同大小行高
        size: {
            type: String,
            default: "middle",
        },
        //刷新  刷新整表
        isRefresh: {
            type: Boolean,
            default: false,
        },
        //自定义接口,只针对get接口  需要携带baseUrl
        methodName: {
            type: String,
            default: "",
        },
        // 异步展开     适用于数据量较多的属性结构，需将异步节点children设置为[]
        expandInAsync: {
            type: Boolean,
            default: false,
        },
        //默认展开所有行，优先级高于 expandToLevel
        defaultExpandAllRows: {
            type: Boolean,
            default: true,
        },
        // 默认展开层级，为0时默认不展开
        expandToLevel: {
            type: Number,
            default: 0,
        },
        //自动编号  第一列出现从1开始的编号，不区分父子结构
        autoNumber: {
            type: Boolean,
            default: false,
        },
    },
    emits: [
        "clickMoreOptions", //点击“操作”列自定义菜单
        "update:isRefresh", //更新整表后赋值false
        "afterSuccess", //新建、删除、更新等操作成功后的传递，共4个参数：type：更新类型；col：当前列的信息；record：修改后行数据；data：整表数据
        "update:dataSource",
        "update:selectedRowKeys",
    ],
    setup(props, ctx) {
        //#region 获取table的ref
        const tableRef = ref();
        //#endregion 获取table的ref

        const loading = ref(false); //表格loading状态
        const defaultIndex = ref<number>(props.defaultIndex); //默认列处理，对复选框、拖动列等处理到用户需要的列
        const tableKey = ref<number>(0); //用于强制刷新表格

        //#region 封装接口
        const { proxy } = getCurrentInstance(); //获取vue实例
        const methods = {
            //拼接前后端交互接口
            getRights: `${props.baseUrl}/get${props.objectType}TableRights`,
            getList: `${props.baseUrl}/get${props.objectType}List`,
            update: `${props.baseUrl}/update${props.objectType}`,
            createNew: `${props.baseUrl}/create${props.objectType}`,
            sub: `${props.baseUrl}/sub${props.objectType}`,
            insert: `${props.baseUrl}/insert${props.objectType}`,
            delete: `${props.baseUrl}/delete${props.objectType}`,
            continueDelete: `${props.baseUrl}/continueDelete${props.objectType}`,
            drag: `${props.baseUrl}/drag${props.objectType}`,
            outdentIndent: `${props.baseUrl}/outdentIndent${props.objectType}`,
            //   move: `${props.baseUrl}/move${props.objectType}`,
        };
        //封装接口调用，均为post类型，组件内使用
        const post = (methodName: string, params: object | null) => {
            return proxy.$ajax({
                url: methodName,
                method: "post",
                data: params,
            });
        };
        //封装接口调用，get类型，组件内使用
        const get = (methodName: string, params: object | null) => {
            return proxy.$ajax({
                url: methodName,
                method: "get",
                params,
            });
        };
        //#endregion 封装接口

        //#region 为父子结构计算树形列的位置，调整展开图标位置
        //调整表格展开图标对应树形列，通过isTree判断
        const expandIconColumnIndex = computed(() => {
            let expandColumnIndex = columnsTable.value.findIndex(
                (item: ColumnType) => item.isTree
            );
            if (props.canChecked) {
                expandColumnIndex = expandColumnIndex + 2;
            }
            return expandColumnIndex;
        });
        //#endregion

        //#region 为缓存模式随机生成Guid
        const guid = () => {
            let mathRandom = () => {
                return (((1 + Math.random()) * 0x10000) | 0)
                    .toString(16)
                    .substring(1);
            };
            return (
                mathRandom() +
                mathRandom() +
                "-" +
                mathRandom() +
                "-" +
                mathRandom() +
                "-" +
                mathRandom() +
                "-" +
                mathRandom() +
                mathRandom() +
                mathRandom()
            );
        };
        //#endregion

        //#region 监听isRefresh，刷新整表
        watch(
            () => props.isRefresh,
            (newValue, oldValue) => {
                if (newValue) {
                    init();
                }
            }
        );
        //#endregion

        const dataTable: Ref<DataItem[]> = ref([]);
        const columnsTable: Ref<ColumnType[]> = ref([]);

        //#region 定义get接口，获取表格数据
        const getList = (record?: DataItem | null) => {
            loading.value = true;
            let paramerters = {
                ...props.params,
            };
            if (record) {
                //该参数用于异步展开，用过传父id获取对应的子
                paramerters.id = record.id;
            }
            get(
                props.methodName ? props.methodName : methods.getList, //确定调用接口，优先自定义接口
                paramerters
            )
                .then((res: any) => {
                    loading.value = false;

                    if (record) {
                        //异步加载数据处理
                        if (!record.children) {
                            record.children = [...res];
                        } else {
                            record.children = record.children.concat(res);
                        }
                    } else {
                        dataTable.value = res;
                    }
                    refreshData(); //数据处理，格式化数据、自动编号等
                    expandToLevel(); //展开到指定层级
                    ctx.emit("update:isRefresh", false);
                })
                .catch((err: any) => {
                    loading.value = false;
                });
        };
        //#endregion

        //#region 新建与取消
        const createItemValue = ref("");
        const addNew = () => {
            if (createItemValue.value) {
                if (!props.cacheMode) {
                    //非缓存模式数据处理
                    let paramerters = {
                        value: createItemValue.value,
                        ...props.params,
                    };
                    post(methods.createNew, paramerters)
                        .then((res: any) => {
                            message.success("新建成功");
                            dataTable.value.push(res);
                            refreshData();
                            createItemValue.value = "";
                            afterSuccess(
                                "create",
                                columnsTable.value[defaultIndex.value],
                                res,
                                dataTable.value
                            );
                        })
                        .catch((err: any) => {});
                } else {
                    //缓存模式数据处理
                    let res = {
                        id: guid(),
                    };
                    res[columnsTable.value[defaultIndex.value].dataIndex] = //默认列新增数据
                        createItemValue.value;
                    dataTable.value.push(res);
                    refreshData();
                    createItemValue.value = "";
                    afterSuccess(
                        "create",
                        columnsTable.value[defaultIndex.value],
                        res,
                        dataTable.value
                    );
                    message.success("新建成功");
                }
            }
        };
        const cancelNew = () => {
            //取消新建
            createItemValue.value = "";
        };
        //#endregion

        //#region 删除数据
        const deleteItem = (record: DataItem) => {
            Modal.confirm({
                title: `确定要删除该${props.objectName}吗？`,
                onOk() {
                    let findItem = (arr: any) => {
                        //该方法递归循环找到要删除的条目，同时对其父的children参数进行处理
                        for (let i = 0; i < arr.length; i++) {
                            if (arr[i].id == record.parentId) {
                                if (
                                    arr[i].children &&
                                    arr[i].children.length == 1
                                ) {
                                    arr[i].children = null;
                                }
                            }
                            if (arr[i].id != record.id) {
                                if (arr[i].children && arr[i].children.length) {
                                    findItem(arr[i].children);
                                }
                            } else {
                                arr.splice(i, 1);
                            }
                        }
                    };
                    if (props.cacheMode) {
                        //缓存模式处理
                        findItem(dataTable.value);
                        refreshData();
                        afterSuccess(
                            "delete",
                            columnsTable.value[defaultIndex.value],
                            record,
                            dataTable.value
                        );
                        message.success("删除成功");
                    } else {
                        let paramerters = {
                            id: record.id,
                            ...props.params,
                        };
                        post(methods.delete, paramerters)
                            .then((res: any) => {
                                message.success("删除成功");
                                findItem(dataTable.value);
                                let arr: Ref<DataItem[]> = ref([]);
                                dataTable.value = arr.value.concat(
                                    dataTable.value
                                );
                                afterSuccess(
                                    "delete",
                                    columnsTable.value[defaultIndex.value],
                                    res,
                                    dataTable.value
                                );
                            })
                            .catch((err: any) => {});
                    }
                },
                onCancel() {},
                class: "test",
            });
        };
        //#endregion

        //#region ★★★ 更新单行数据
        const updateSingleRow = (arr: DataItem[], record: DataItem) => {
            //递归查找对应条目更新单行
            arr.map((item: DataItem, index: number) => {
                if (item.id == record.id) {
                    Object.assign(item, record);
                } else {
                    if (item.children && item.children.length) {
                        updateSingleRow(item.children, record);
                    }
                }
            });
        };
        //#endregion

        //#region ★★ 用于控制可编辑单元格
        // editableData：{key: {record}}    用于记录可编辑行数据，实时修改
        // editColumnName：column.dataInex  记录编辑单元格的列dataIndex
        // editItemOldData： {}             用于储存修改前行数据
        const editTableData: UnwrapRef<Record<string, DataItem>> = reactive({});
        const editColumnName = ref<string>("");
        const editItemOldData: Ref<DataItem> = ref({});
        // 点击单元格编辑时，记录原始数据数据及列
        const saveEditItemOldData = (record: DataItem) => {
            editItemOldData.value = JSON.parse(JSON.stringify(record));
        };
        //记录当前正在编辑的行的数据，删除其他行数据
        const changeEditTableData = (editItem: DataItem, id: string) => {
            dataTable.value.map((item: DataItem) => {
                if (item.id == id) {
                    editTableData[id] = editItem[id];
                } else {
                    delete editTableData[item.id];
                }
            });
        };
        //记录正在编辑的列的dataIndex
        const changeEditColumnName = (value: any) => {
            editColumnName.value = value;
        };
        //#endregion

        //#region ★更新update
        const updateDataSource = (
            id: string | number, //当前行的id
            col: ColumnType, //当前列
            value: any //修改后的值
        ) => {
            if (editItemOldData.value[col.dataIndex] == value) {
                //如果修改后的值与原先的值一致，则不进行接口调用和保存
                return;
            }
            if (props.cacheMode) {
                //缓存模式数据处理
                let res = ref<DataItem>();
                let findItem = (arr: any) => {
                    //递归查找对应修改的条目并记录
                    for (let i = 0; i < arr.length; i++) {
                        if (arr[i].id != id) {
                            if (arr[i].children && arr[i].children.length) {
                                findItem(arr[i].children);
                            }
                        } else {
                            res = arr[i];
                        }
                    }
                };
                findItem(dataTable.value);
                updateSingleRow(dataTable.value, res); //覆盖更新单行数据
                afterSuccess("update", col, res, dataTable.value);
            } else {
                let submitValue = formatParam(value, col)
                let paramerters = {
                    id: id,
                    columnName:
                        col.dataIndex.substring(0, 1).toUpperCase() +
                        col.dataIndex.substring(1),
                    value: submitValue.value,
                    ...props.params,
                };
                post(methods.update, paramerters)
                    .then((res: any) => {
                        updateSingleRow(dataTable.value, res);
                        afterSuccess("update", col, res, dataTable.value);
                    })
                    .catch((err: any) => {
                        updateSingleRow(dataTable.value, editItemOldData.value);
                    })
                    .finally(() => {
                        refreshData();
                    });
            }
        };
        const formatParam = (value: any, col: ColumnType) => {
            let submitValue = ref<any>();
            switch (col.type) {
                case "Select":
                    submitValue.value = value.value;
                    break;
                case "MutiSelect":
                    submitValue.value = JSON.stringify(
                        value.map((item:any) => item.value)
                    );
                    break;
                default:
                    submitValue.value = value;
                    break;
            }
            return submitValue;
        };
        //#endregion

        //#region ★★分解
        const key = ref<number>(0); //针对多次点击分解、插入，导致输入框不能重复聚焦的解决

        //取消分解或删除的输入框行数据
        const deleteOptionItem = (
            optionId: string,
            arr: DataItem[],
            parent?: DataItem
        ) => {
            let index = arr.findIndex((item: DataItem) => item.id == optionId);
            if (index !== -1) {
                arr.splice(index, 1);
                if (!arr.length && optionId == "sub" && parent) {
                    //如果是分解，要对父的children参数进行处理
                    delete parent.children;
                }
            } else {
                arr.map((item: DataItem) => {
                    if (item.children && item.children.length) {
                        deleteOptionItem(optionId, item.children, item);
                    }
                });
            }
        };
        // 点击开始分解子
        const addSub = async (record: DataItem, col?: ColumnType) => {
            let createRow: DataItem = {
                id: "sub",
                createTr: true,
                level: (record.level ?? 1) + 1,
                parentId: record.id,
            };
            //确保只存在一个输入框
            await deleteOptionItem("sub", dataTable.value); //删除原先分解行
            await deleteOptionItem("insert", dataTable.value); //删除原先插入行
            let scrollItem = ref<DataItem>({});
            let filterSub = (arr: DataItem[]) => {
                //递归查找要分解的行，进行参数设置
                arr.map((item: DataItem, index: number) => {
                    if (item.id == record.id) {
                        if (!item.children) {
                            item.children = [];
                        }
                        scrollItem.value =
                            item.children.length > 2
                                ? item.children[item.children.length - 2]
                                : item;
                        expandedRowKeys.value.push(item.id);
                        item.children.push(createRow);
                    } else {
                        if (item.children && item.children.length) {
                            filterSub(item.children);
                        }
                    }
                });
            };
            await filterSub(dataTable.value);
            refreshData();
            key.value++;
        };
        //#endregion

        //#region ★★插入
        const insertItem = async (record: DataItem) => {
            let insertRow: DataItem = {
                id: "insert",
                createTr: true,
                parentId: record.parentId,
                level: record.level,
                insertId: record.id,
            };
            await deleteOptionItem("sub", dataTable.value); //删除原先分解行
            await deleteOptionItem("insert", dataTable.value); //删除原先插入行
            let filterInsert = (arr: DataItem[]) => {
                //递归查找要插入的行，进行表格数据处理
                let insertIndex = ref(-1);
                arr.map((item: DataItem, index: number) => {
                    if (item.id == record.id) {
                        insertIndex.value = index;
                        return;
                    } else {
                        if (item.children && item.children.length) {
                            filterInsert(item.children);
                        }
                    }
                });
                if (insertIndex.value !== -1) {
                    arr.splice(insertIndex.value, 0, insertRow);
                }
            };
            await filterInsert(dataTable.value);
            refreshData();
            key.value++;
        };
        //#endregion

        //#region ★★分解子或插入的处理
        //处理完成
        const editOk = (value: string, record: DataItem) => {
            let parantItem = ref<DataItem>();
            let replaceOptionItem = (
                //递归查找生成数据
                arr: DataItem[],
                res: DataItem,
                isCacheMode?: boolean
            ) => {
                let insertOrSubIndex = ref(-1);
                arr.map((item: DataItem, index: number) => {
                    if (item.id == record.parentId) {
                        parantItem.value = item;
                    }
                    if (item.id == record.id) {
                        if (isCacheMode) {
                            res.id = guid();
                            res.createTr = false;
                            res[
                                columnsTable.value[defaultIndex.value].dataIndex
                            ] = value;
                        }
                        insertOrSubIndex.value = index;
                    } else {
                        if (item.children && item.children.length) {
                            replaceOptionItem(item.children, res, isCacheMode);
                        }
                    }
                });
                if (insertOrSubIndex.value !== -1) {
                    arr.splice(insertOrSubIndex.value, 0, res);
                }
            };
            if (value) {
                if (props.cacheMode) {
                    //缓存模式
                    let recordCopy = ref(JSON.parse(JSON.stringify(record)));
                    replaceOptionItem(dataTable.value, recordCopy.value, true);
                    formatDataSource(dataTable.value);
                    if (record.id == "sub") {
                        addSub(parantItem.value);
                    } else {
                        editCancel(record.id);
                    }
                    afterSuccess(
                        record.id,
                        recordCopy,
                        columnsTable.value[defaultIndex.value],
                        dataTable.value
                    );
                } else {
                    let paramerters = {
                        id:
                            record.id == "sub"
                                ? record.parentId
                                : record.insertId,
                        value: value,
                        isBefore: false, //该参数仅用于插入
                        ...props.params,
                    };
                    let url = record.id == "sub" ? methods.sub : methods.insert; //区分“分解”“插入”接口
                    post(url, paramerters)
                        .then((res: any) => {
                            replaceOptionItem(dataTable.value, res);
                            formatDataSource(dataTable.value);
                            if (record.id == "sub") {
                                //连续分解处理
                                addSub(parantItem.value);
                            } else {
                                editCancel(record.id);
                            }
                            afterSuccess(
                                record.id,
                                res,
                                columnsTable.value[defaultIndex.value],
                                dataTable.value
                            );
                        })
                        .catch((err: any) => {});
                }
            }
        };
        //取消分解子或插入的输入框，删除已出现条目
        const editCancel = (id: string) => {
            deleteOptionItem(id, dataTable.value);

            refreshData();
        };
        //#endregion

        //#region ★★升降级
        const upOrDownGrade = (record: DataItem, bol: boolean = false) => {
            let optionGrade = (
                //递归查找，并运行callback
                arr: DataItem[],
                record1: DataItem,
                callback: Function
            ) => {
                if (!record1.parentId) {
                    callback(dataTable.value, record1);
                } else {
                    arr.map((item: DataItem, index: number) => {
                        if (item.id == record1.parentId) {
                            callback(arr, record1);
                        } else {
                            if (item.children && item.children.length) {
                                optionGrade(item.children, record1, callback);
                            }
                        }
                    });
                }
            };
            let success = () => {
                if (bol) {
                    //升级
                    optionGrade(
                        dataTable.value,
                        record,
                        (parentArr: DataItem[], record2: DataItem) => {
                            if (record2.level == 1 || !record2.parentId) {
                                //判断是最高层级
                                message.warning(
                                    `已为最高层级${props.objectName},不可继续升级`
                                );
                            } else {
                                let upParentIndex = ref(-1);
                                parentArr.map(
                                    (item: DataItem, index: number) => {
                                        if (item.id == record2.parentId) {
                                            //找到父任务条目
                                            record2.level = item.level;
                                            record2.parentId = item.parentId;
                                            upParentIndex.value = index; //记录所在位置，方便插入

                                            if (
                                                item.children &&
                                                item.children.length
                                            ) {
                                                //对父任务的所有子进行操作
                                                if (item.children.length == 1) {
                                                    // 父节点子任务只有一条，删除父节点子
                                                    item.children = null;
                                                } else {
                                                    let inChildIndex =
                                                        item.children.findIndex(
                                                            //找到在所有子中的位置
                                                            (res: DataItem) =>
                                                                res.id ==
                                                                record2.id
                                                        );
                                                    if (!record2.children) {
                                                        // record没有子则初始化
                                                        record2.children = [];
                                                    }
                                                    //循环将父节点的子中位于record之下的放入record中
                                                    item.children.map(
                                                        (
                                                            res: DataItem,
                                                            resIndex: number
                                                        ) => {
                                                            if (
                                                                resIndex >
                                                                inChildIndex
                                                            ) {
                                                                //将record后面的子变为record的子
                                                                res.parentId =
                                                                    record2.id;
                                                                record2.children.push(
                                                                    res
                                                                );
                                                            }
                                                        }
                                                    );

                                                    //删除被挪移走的子
                                                    if (inChildIndex == 0) {
                                                        // 如果在第一个子，删除父的属性
                                                        item.children = null;
                                                    } else {
                                                        // 删除后面的子
                                                        item.children.splice(
                                                            inChildIndex
                                                        );
                                                    }
                                                }
                                            }
                                        }
                                    }
                                );
                                if (upParentIndex.value !== -1) {
                                    //在记录的位置插入record
                                    parentArr.splice(
                                        upParentIndex.value + 1,
                                        0,
                                        record2
                                    );
                                }
                            }
                        }
                    );
                } else {
                    //降级
                    optionGrade(
                        dataTable.value,
                        record,
                        (parentArr: DataItem[], record3: DataItem) => {
                            //record3 选中的行
                            if (record3.level == 1 || !record3.parentId) {
                                // 对与第一层级的条目
                                let level1Index = dataTable.value.findIndex(
                                    (res: DataItem) => res.id == record3.id
                                );
                                if (level1Index == 0) {
                                    //位于第一个，前面没有条目，不能降级
                                    message.warning(
                                        `已是表格第一个${props.objectName}，不能降级`
                                    );
                                } else {
                                    if (
                                        !dataTable.value[level1Index - 1]
                                            .children
                                    ) {
                                        // 没有子则初始化子
                                        dataTable.value[
                                            level1Index - 1
                                        ].children = [];
                                    }
                                    record3.level = 2; // 层次+1
                                    record3.parentId =
                                        dataTable.value[level1Index - 1].id; //record的父id修改为前一条id
                                    dataTable.value[
                                        level1Index - 1
                                    ].children?.push(record3); // record前一条增加子
                                    dataTable.value.splice(level1Index, 1); // 删除record
                                }
                            } else {
                                let parentIndex = parentArr.findIndex(
                                    // 查找父所在层级的数组中的位置
                                    (res: DataItem) =>
                                        res.id == record3.parentId
                                );
                                let childrenArr =
                                    parentArr[parentIndex].children || [];
                                let recordIndex = childrenArr.findIndex(
                                    // 查找在所有子中的位置
                                    (res: DataItem) => res.id == record3.id
                                );
                                if (recordIndex == 0) {
                                    // 第一个子不能降级
                                    message.warning(
                                        `已是第一个子${props.objectName}，不能继续降级`
                                    );
                                } else {
                                    record3.parentId =
                                        childrenArr[recordIndex - 1].id; // 修改parentUd
                                    record3.level = record3.level + 1; // 修改level
                                    if (
                                        !childrenArr[recordIndex - 1].children
                                    ) {
                                        // 没有子初始化子
                                        childrenArr[recordIndex - 1].children =
                                            [];
                                    }
                                    childrenArr[recordIndex - 1].children.push(
                                        record3
                                    ); // 增加子
                                    childrenArr.splice(recordIndex, 1);
                                }
                            }
                        }
                    );
                }
            };
            if (props.cacheMode) {
                success();
                refreshData();
                afterSuccess(
                    bol ? "outdent" : "indent",
                    {},
                    record,
                    dataTable.value
                );
            } else {
                let paramerters = {
                    id: record.id,
                    IsOutdent: bol,
                    ...props.params,
                };
                post(methods.outdentIndent, paramerters)
                    .then((res: any) => {
                        success();
                        refreshData();
                        afterSuccess(
                            bol ? "outdent" : "indent",
                            {},
                            res,
                            dataTable.value
                        );
                    })
                    .catch(() => {});
            }
        };
        //#endregion

        //#region 拖动
        const onRowDragEnd = (ops: DragRowEventInfo) => {
            let toId =
                ops.preTargetInfo?.record.id || ops.nextTargetInfo?.record.id;
            let insertSlot = ops.preTargetInfo ? 0 : 2; //判断前插后插
            return new Promise<void>((reslove, reject) => {
                if (props.cacheMode) {
                    afterSuccess(
                        ops.preTargetInfo ? "insertAfter" : "insertBefore",
                        {},
                        ops.preTargetInfo?.record || ops.nextTargetInfo?.record,
                        dataTable.value
                    );
                    reslove();
                } else {
                    let paramerters = {
                        id: ops.record.id,
                        toId: toId,
                        type: insertSlot,
                        ...props.params,
                    };
                    //type  0:insertAfter    2:insertBefore
                    post(methods.drag, paramerters)
                        .then((res: any) => {
                            afterSuccess(
                                ops.preTargetInfo
                                    ? "insertAfter"
                                    : "insertBefore",
                                {},
                                res,
                                dataTable.value
                            );
                            reslove();
                        })
                        .catch(() => {
                            reject();
                        });
                }
            });
        };
        //#endregion

        //#region 分页      已取消分页功能
        const pagination = ref<STablePaginationConfig>({
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
            pageSize: 10,
        });
        //#endregion

        //#region 复选框参数及方法
        const rowSelection: STableProps["rowSelection"] = {
            checkStrictly: true,
            selectedRowKeys: props.selectedRowKeys ?? [],
            onChange: (selectedKeys: string[], selectedRows: DataItem[]) => {
                ctx.emit("update:selectedRowKeys", selectedKeys);
            },
            getCheckboxProps: (record: DataItem) => ({}),
        };
        //#endregion

        //#region 展开行参数及方法
        const expandedRowKeys = ref<string[] | number[]>([]);
        const expand = (expanded: boolean, record: DataItem) => {
            if (expanded) {
                //展开
                if (
                    props.expandInAsync &&
                    record.children &&
                    !record.children.length &&
                    !props.defaultExpandAllRows
                ) {
                    //异步加载
                    getList(record);
                }
                expandedRowKeys.value.push(record.id);
            } else {
                //收缩
                let index = expandedRowKeys.value.findIndex(
                    (item: any) => item === record.id
                );
                if (index >= 0) {
                    expandedRowKeys.value.splice(index, 1);
                }
            }
            expandedRowKeys.value = [].concat(expandedRowKeys.value);
        };
        //初始化时默认展开的行，所有/某一级别
        const expandToLevel = () => {
            let findToLevel = (arr: any, level: number) => {
                //递归查找符合条件的层级，进行展开
                arr.map((item: DataItem) => {
                    if (
                        (item.level ?? 1) <= level &&
                        item.children &&
                        item.children.length
                    ) {
                        expandedRowKeys.value.push(item.id);
                        findToLevel(item.children, level);
                    }
                });
            };
            if (props.defaultExpandAllRows) {
                findToLevel(dataTable.value, 100);
            } else {
                findToLevel(dataTable.value, props.expandToLevel);
            }
            expandedRowKeys.value = [].concat(expandedRowKeys.value);
        };
        //#endregion

        //#region 渲染输入框——分解、插入
        const renderCreateRow = (col: ColumnType, record: DataItem) => {
            let isDefaultIndex =
                col.dataIndex ==
                columnsTable.value[defaultIndex.value].dataIndex;

            if (isDefaultIndex) {
                return {
                    children: (
                        <div
                            style={{
                                display: "-webkit-box",
                            }}
                        >
                            <EditInput
                                key={key.value}
                                objectName={props.objectName}
                                onEditOk={(value: string) =>
                                    editOk(value, record)
                                }
                                onEditCancel={() => editCancel(record.id)}
                            ></EditInput>
                        </div>
                    ),
                    props: {
                        colSpan: columnsTable.value.length + 1,
                    },
                };
            } else {
                return {
                    props: {
                        colSpan: 0,
                    },
                };
            }
        };
        //#endregion

        //#region 渲染单元格
        const renderCell = (data: any) => {
            let formatCell = "";
            // let isDefaultIndex =
            //     col.dataIndex == columnsTable.value[defaultIndex.value].dataIndex;
            // 实现插入编辑行
            if (data.record && data.record.createTr) {
                return renderCreateRow(data.column, data.record);
            }

            // 如果当前列没有type类型，也就是不需要编辑，适用formaterJSX来渲染表格
            if (!data.column.type) {
                return data.column.formaterJSX(data.column, data.record);
            }

            // 如果没有编辑某个格子的权限，那么就不能编辑，也不能出现任何可以编辑的图标。
            // let enabledCell = this.enabled;
            // if (this.lazyLoadRightsEnabled) {
            //     enabledCell = rights.tdRights[col.dataIndex];
            // }

            //生成formaterJSX模板
            if (data.column.formaterJSX) {
                formatCell = data.column.formaterJSX(data.column, data.record);
            }
            //判断列的可编辑权限
            let columnCanEdit = () => {
                let columnEdit = ref(false);
                if (typeof data.column.canEdit == "function") {
                    columnEdit.value = data.column.canEdit(
                        data.column,
                        data.record
                    );
                } else {
                    columnEdit.value = data.column.canEdit;
                }
                return columnEdit.value;
            };

            //设置插槽
            let slots = {
                default: () => {
                    return formatCell;
                },
            };
            return (
                <TableCell
                    v-slots={slots}
                    record={data.record}
                    column={data.column}
                    canEdit={columnCanEdit() && props.canEdit}
                    canSub={props.canSub}
                    editTableData={editTableData}
                    editColumnName={editColumnName.value}
                    onUpdateDataSource={(
                        id: string | number,
                        col: ColumnType,
                        value
                    ) => updateDataSource(id, col, value)}
                    onChangeEditTableData={(editItem: DataItem, id: string) =>
                        changeEditTableData(editItem, id)
                    }
                    onAddSub={(record1: DataItem, col: ColumnType) =>
                        addSub(record1, col)
                    }
                    onChangeEditColumnName={(value) =>
                        changeEditColumnName(value)
                    }
                    onSaveEditItemOldData={(record: DataItem) =>
                        saveEditItemOldData(record)
                    }
                    onClickCustom={() =>
                        onClickCustom(data.column, data.record)
                    }
                    onInitSelectSource={(resolve: Function) =>
                        initSelectSource(resolve, data)
                    }
                ></TableCell>
            );
        };
        //formaterJSX的点击事件返回
        const onClickCustom = (col: ColumnType, record: DataItem) => {
            col.clickCallback && col.clickCallback(record);
        };
        //对于下拉数据源的处理，分为首次加载和实时加载
        const selectSource = ref<{ [key: string | number]: any }>({});
        const initSelectSource = (resolve: Function, data: any) => {
            if (
                selectSource.value[data.column.dataIndex] &&
                !data.column.options.differentSource
            ) {
                resolve(selectSource.value[data.column.dataIndex]);
            } else {
                if (Array.isArray(data.column.options.dataSource)) {
                    resolve(data.column.options.dataSource);
                } else {
                    if (typeof data.column.options.dataSource == "function") {
                        data.column.options
                            .dataSource(data.column, data.record)
                            .then((result: Array<object>) => {
                                resolve(result);
                                selectSource.value[data.column.dataIndex] =
                                    result;
                            });
                    }
                }
            }
        };
        //#endregion

        //#region 初始化
        const totalRows = ref<number[]>([]);
        //初始化列
        const initCols = () => {
            totalRows.value = [];
            columnsTable.value = [...props.columns];
            //默认列处理
            defaultIndex.value =
                props.defaultIndex +
                (props.autoNumber
                    ? props.canDrag
                        ? 2
                        : 1
                    : props.canDrag
                    ? 1
                    : 0);

            //自动编号
            if (props.autoNumber) {
                columnsTable.value.unshift({
                    title: "No",
                    dataIndex: "onlineEditTableCode",
                    width: "50px",
                    rowDrag: false,
                    canEdit: false,
                    align: "left",
                    formaterJSX: (col: ColumnType, record: DataItem) => {
                        return record.onlineEditTableCode;
                    },
                });
            }
            //拖动列
            if (props.canDrag) {
                columnsTable.value.unshift({
                    title: "#",
                    dataIndex: "dragCol",
                    width: "50px",
                    rowDrag: true,
                    canEdit: false,
                    align: "center",
                    formaterJSX: (col: ColumnType, record: DataItem) => {
                        return "";
                    },
                });
            }

            //操作列
            if (
                props.canEdit &&
                (props.canUpOrDownGrade ||
                    props.canInsert ||
                    props.canDelete ||
                    props.moreOptions.length)
            ) {
                columnsTable.value.push({
                    title: "操作",
                    dataIndex: "operation",
                    width: "65px",
                    align: "center",
                    formaterJSX: (col: ColumnType, record: object) => {
                        return (
                            <MoreOptions
                                record={record}
                                canDelete={props.canDelete}
                                canInsert={props.canInsert}
                                canUpOrDownGrade={
                                    props.canSub && props.canUpOrDownGrade
                                }
                                moreOptions={props.moreOptions}
                                onDeleteItem={(data: DataItem) =>
                                    deleteItem(data)
                                }
                                onClickMoreOptions={(
                                    data: DataItem,
                                    menu: any
                                ) => ctx.emit("clickMoreOptions", data, menu)}
                                onInsertItem={(data: DataItem) =>
                                    insertItem(data)
                                }
                                onUpOrDownGrade={(
                                    data: DataItem,
                                    bol: boolean
                                ) => upOrDownGrade(data, bol)}
                            ></MoreOptions>
                        );
                    },
                });
            }
            columnsTable.value.map((element: any, index: number) => {
                // 未指明是否可编辑，默认未可编辑
                if (element.canEdit == undefined) {
                    element.canEdit = true;
                }
                // 如果没有type，且没有指定formaterJSX，自动指定默认的
                if (!element.type && !element.formaterJSX) {
                    element.formaterJSX = (col: ColumnType, record: any) => {
                        return <span>{record[col.dataIndex]}</span>;
                    };
                }
                if (element.canSummary) {
                    totalRows.value.push(index);
                }
            });
            let renderCols = (cols: ColumnType[]) => {
                //递归渲染多层级合并列
                for (let i = 0; i < cols.length; i++) {
                    if (cols[i].children && cols[i].children?.length) {
                        //多级合并表头的渲染处理，目前只处理一层合并，后续待处理
                        renderCols(cols[i].children);
                    } else {
                        cols[i].customRender = (data: any) => renderCell(data);
                    }
                }
            };
            renderCols(columnsTable.value);
            let arr: Ref<ColumnType[]> = ref([]);
            columnsTable.value = arr.value.concat(columnsTable.value);
        };

        // 数据初始化
        const init = async () => {
            if (props.cacheMode) {
                //缓存模式
                dataTable.value = props.dataSource;
                refreshData();
                expandToLevel();
            } else {
                await getList();
            }
            initAutoNum();
        };
        //#endregion

        //#region 帮助方法
        // 格式化数据，parentId，level
        const formatDataSource = (data: DataItem[], parent?: DataItem) => {
            data.map((item: DataItem) => {
                if (item.parentId == undefined) {
                    item.parentId = parent?.id ?? null;
                }
                if (item.level == undefined) {
                    item.level = (parent?.level ?? 0) + 1;
                }
                if (item.children && item.children.length) {
                    formatDataSource(item.children, item);
                }
            });
        };
        //自动序号
        const initAutoNum = () => {
            let totalIndex = ref<number>(0);
            let autoNum = (arr: DataItem[], oriTotal: number = 0) => {
                arr.map((item: DataItem, index: number) => {
                    item.onlineEditTableCode = totalIndex.value + 1;
                    totalIndex.value++;
                    if (item.children?.length) {
                        autoNum(item.children, item.onlineEditTableCode);
                    }
                });
            };
            autoNum(dataTable.value);
        };
        //刷新数据
        const refreshData = () => {
            formatDataSource(dataTable.value);
            initAutoNum();
            let arr: Ref<DataItem[]> = ref([]);
            dataTable.value = arr.value.concat(dataTable.value);
        };
        //#endregion

        //#region afterSuccess 操作成功后的处理
        const afterSuccess = (
            type: string,
            col: ColumnType,
            record: DataItem,
            data: DataItem[]
        ) => {
            ctx.emit("update:dataSource", data);
            ctx.emit("afterSuccess", type, col, record, data);
        };
        //#endregion

        //#region 点击表格外，进行保存
        const clickOutside = () => {
            let col = columnsTable.value.find(
                (item: ColumnType) => item.dataIndex == editColumnName.value
            );
            if (col) {
                updateSingleRow(
                    dataTable.value,
                    editTableData[editItemOldData.value.id ?? ""]
                );
                updateDataSource(
                    editItemOldData.value.id ?? "",
                    col,
                    editTableData[editItemOldData.value.id ?? ""][
                        editColumnName.value
                    ]
                );
                delete editTableData[editItemOldData.value.id ?? ""];
                editColumnName.value = "";
            }
        };
        //#endregion

        provide("dataTable", dataTable);
        provide("columns", columnsTable);
        provide("editItemOldData", editItemOldData);

        onMounted(() => {
            init();
            initCols();
        });
        watch(
            () => [props.canEdit, props.canDrag, props.moreOptions],
            () => {
                initCols();
                tableKey.value++;
            },
            {
                deep: true,
            }
        );

        return {
            tableRef,
            tableKey,
            loading,
            pagination,
            editTableData,
            editItemOldData,
            editColumnName,
            dataTable,
            columnsTable,
            expandIconColumnIndex,
            rowSelection,
            expandedRowKeys,
            totalRows,
            deleteItem,
            //   edit,
            //   save,
            //   cancel,
            updateDataSource,
            expand,
            changeEditTableData,
            createItemValue,
            addNew,
            cancelNew,
            onRowDragEnd,
            clickOutside,
        };
    },
});
</script>
<style lang="scss">
.surely-table-has-animate .surely-table-row {
    .sub-cell-icon {
        svg {
            position: absolute;
            right: 0;
            width: 20px;
            top: 40%;
            cursor: pointer;
            float: right;
            display: none;
        }
    }
    .editable-cell-icon {
        svg {
            cursor: pointer;
            float: right;
            display: none;
        }
    }
    &:hover {
        .sub-cell-icon {
            svg {
                display: inline-block;
            }
        }
        .editable-cell-icon {
            svg {
                display: inline-block;
            }
        }
    }
}
.sub-cell-icon:hover {
    color: #40a9ff;
}
.editable-cell-icon:hover {
    color: #40a9ff;
}
</style>
