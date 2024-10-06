import { wait } from "../../lib/util";

export namespace Notifications {
    export async function addNotification(text: string): Promise<void> {
        clear();

        const notificationContainer = document.querySelector('.notification-container')!;

        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.textContent = text;
        notificationContainer.appendChild(notification);
        await wait(0.1);
        notification.classList.add('shown-notification');

        await wait(10);
        // Remove element.
        notification.remove();
    }

    export function clear(): void {
        const notificationContainer = document.querySelector('.notification-container')!;
        notificationContainer.innerHTML = '';
    }
}
