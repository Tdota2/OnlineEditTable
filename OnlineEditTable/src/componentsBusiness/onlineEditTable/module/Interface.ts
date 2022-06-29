//columns接口
export interface ColumnType {
    title: string;
    dataIndex: string;
    width?: string | number;
    type?: string;
    options?: ColumnOptions;
    resizable?: boolean;
    canEdit?: boolean | Function;
    autoHeight?: boolean;
    isTree?: boolean;
    align?: string;
    formaterJSX?: Function;
    customRender?: Function;
    rowDrag?: boolean;
    clickCallback?: Function;
    canSummary?: boolean;
    fixed?: boolean;
    children?: []
}
//列额外参数
export interface ColumnOptions {
    differentSource?: boolean;
    dataSource?: Function;
    placeholder?: string;
    //inputNumber
    max?: number;
    min?: number;
    formatter?: Function;
    precision?: number;
    step?: number | string;
    //textarea
    showCount?: boolean;
    //datapicker
    disabledDate?: Function;
    picker?: string;
    format?: string | Function;
    showTime?: Object | boolean;
    showNow?: boolean;
    showToday?: boolean;
    //SelectCommon
    title?: string
    isSingle?: boolean;
    objectType?: string;
    enableRecent?: boolean;
    methodName?: string;
    params?: object;
    projectId?: string
}
//数据接口
export interface DataItem {
    id?: string | number;
    level?: number;
    children?: Array<DataItem> | null;
    parentId?: string | number | null;
    insertId?: string | number | null;
    createTr?: boolean;
    onlineEditTableCode?: number
}
//更多操作菜单接口
export interface moreOptionsType {
    id: string | number,
    title: string | number,
    canShow?: boolean,
    icon?: string,
    iconFont?: string
}
//随机对象
export interface AnyObject {
    [key: string]: any
}
//单元格编辑类型枚举值
export enum EditCellType {
    Input = 'Input',
    InputNumber = 'inputNumber',
    Textarea = 'Textarea',
    Select = 'Select',
    MutiSelect = 'MutiSelect',
    DatePicker = 'DatePicker',
    RangePicker = 'RangePicker',
    Checkbox = 'Checkbox',
    SelectCommon = 'SelectCommon',
    SelectUser = 'SelectUser',
    SelectDepartment = 'SelectDepartment',
}