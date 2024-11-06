import { wait } from '../../lib/util';

export namespace Notifications {
    export async function addNotification(
        text: string,
        removeNotificationPromise: Promise<void> | undefined = undefined
    ): Promise<void> {
        clear();

        const notificationContainer = document.querySelector(
            '.notification-container'
        )!;
        notificationContainer.classList.remove('hidden');

        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.textContent = text;
        notificationContainer.appendChild(notification);
        await wait(0.1);
        notification.classList.add('shown-notification');

        if (removeNotificationPromise) {
            await removeNotificationPromise;
        } else {
            await wait(10);
        }

        // Remove element.
        notification.remove();
    }

    export function clear(): void {
        const notificationContainer = document.querySelector(
            '.notification-container'
        )!;
        notificationContainer.innerHTML = '';
    }
}
