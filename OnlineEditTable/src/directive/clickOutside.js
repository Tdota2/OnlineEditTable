const vClickOutside = {
    /**
     * 绑定方法
     * @param {Object} el - The element the directive is bound to.
     * @param {Object} binding - An vue directive object
     */
    mounted(el, binding) {
        function eventHandler(e){
            let check = false
            if(el.contains(e.target)){return false}
            e.path.map(item => {
                if(item.classList && item.classList.contains('surely-table-body')){         //STable
                    check = true
                }
                if(item.classList && item.classList.contains('ant-select-dropdown')){       //下拉
                    check = true
                }
                if(item.classList && item.classList.contains('ant-picker-dropdown')){       //时间选择
                    check = true
                }
                if(item.classList && item.classList.contains('ant-modal')){                 //modal
                    check = true
                }
            })
            if(check){return false}
            if(binding.value && typeof binding.value === 'function'){
                binding.value(e)
            }
        }
        el.__click_outside__ = eventHandler
        document.addEventListener('click',eventHandler)
    },
    beforeUnmount(el) {
        document.removeEventListener('click', el.__click_outside__);
        delete el.__click_outside__;
    }
};

export default vClickOutside