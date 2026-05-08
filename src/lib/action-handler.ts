/**
 * Wrapper kustom untuk fungsi Server Action.
 * Tujuannya agar error handling dari seluruh service layer bisa konsisten tanpa diulang-ulang (DRY).
 */
export type ActionResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
};

export async function withActionHandler<T>(
    actionFn: () => Promise<T>
): Promise<ActionResponse<T>> {
    try {
        const data = await actionFn();
        return {
            success: true,
            data,
        };
    } catch (error: any) {
        console.error("Action Error:", error.message || error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred",
        };
    }
}
