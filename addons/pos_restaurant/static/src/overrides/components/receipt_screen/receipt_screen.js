import { ReceiptScreen } from "@point_of_sale/app/screens/receipt_screen/receipt_screen";
import { patch } from "@web/core/utils/patch";
import { onWillUnmount } from "@odoo/owl";
import { FloorScreen } from "@pos_restaurant/app/floor_screen/floor_screen";

patch(ReceiptScreen.prototype, {
    setup() {
        super.setup(...arguments);
        onWillUnmount(() => {
            // When leaving the receipt screen to the floor screen the order is paid and can be removed
            if (this.pos.mainScreen.component === FloorScreen && this.currentOrder.finalized) {
                this.pos.removeOrder(this.currentOrder, false);
            }
        });
    },
    //@override
    _addNewOrder() {
        if (!this.pos.config.module_pos_restaurant) {
            super._addNewOrder(...arguments);
        }
    },
    continueSplitting() {
        const originalOrderUuid = this.currentOrder.uiState.splittedOrderUuid;
        this.currentOrder.uiState.screen_data.value = "";
        this.currentOrder.uiState.locked = true;
        this.pos.selectedOrderUuid = originalOrderUuid;
        this.pos.showScreen("ProductScreen");
    },
    isContinueSplitting() {
        if (this.pos.config.module_pos_restaurant && this.currentOrder.originalSplittedOrder) {
            const o = this.currentOrder.originalSplittedOrder;
            return !o.finalized && o.lines.length;
        } else {
            return false;
        }
    },
    //@override
    get nextScreen() {
        if (this.pos.config.module_pos_restaurant) {
            const table = this.pos.selectedTable;
            return { name: "FloorScreen", props: { floor: table ? table.floor_id : null } };
        } else {
            return super.nextScreen;
        }
    },
});
