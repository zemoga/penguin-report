'use strict';
/**
 * @file Main Client app
 * @copyright Zemoga Inc
 */

/* global navigator */
/* global document */
/* global location */
/* global localStorage */
/* global fetch */

/**
 * Penguin report main App
 * @namespace PenguinReport
 */
const PenguinReport = {

  //TODO: Client side code should be switched to ES2015 by Adding a build with babel
  // in the same way it was implemented for server side code
  STORAGE_IDENTIFIER: 'penguin-id',
  STORAGE_NAME: 'penguin-name',
  ROOT_URI: '/penguin-report',

  /**
   * Registers in the push notification
   * @return {void}
   */
  register () {
    if ('serviceWorker' in navigator) {
      console.log('Service Worker is supported');

      // We need the service worker registration to check for a subscription
      navigator.serviceWorker.ready.then((serviceWorkerRegistration) => {

        serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true
        }).then((sub) => {
          const endpointParts = sub.endpoint.split('/');
          const pushRegistry = endpointParts[endpointParts.length - 1];

          console.log('User authorized the notifications: ', sub.endpoint);

          if (localStorage.getItem(PenguinReport.STORAGE_IDENTIFIER)) {
            fetch(PenguinReport.ROOT_URI + '/sync-user/?user=' + localStorage.getItem(PenguinReport.STORAGE_IDENTIFIER) + '&registry=' + pushRegistry).then((response) => {
              if (response.status !== 200) {
                // Either show a message to the user explaining the error
                // or enter a generic message and handle the
                // onnotificationclick event to direct the user to a web page
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                throw new Error();
              }
              return response.json().then((data) => {
                console.log('the data', data);
              }).catch((err) => {
                console.error('Unable to retrieve data', err);
              });
            });
          }
        })
        .catch((err) => {
          console.log('The user disabled the subscription ' + err);
        });

        // Do we already have a push message subscription?
        serviceWorkerRegistration.pushManager.getSubscription()
          .then((subscription) => {
            // Enable any UI which subscribes / unsubscribes from
            // push messages.
            console.log('the suscription', subscription);

            if (subscription && subscription.endpoint) {
              console.log('and the suscription is ', subscription.endpoint);
            }
          })
          .catch((err) => {
            console.warn('Error during getSubscription()', err);
          });
      });

      navigator.serviceWorker.register(PenguinReport.ROOT_URI + '/sw.js')
      .then((serviceWorkerRegistration) => {

        console.log('Authorization starting... ', serviceWorkerRegistration);
      }).catch((err) => {
        console.log(':(', err);
      });
    }
  },

  /**
   * Initializes and request registry
   * @return {void}
   */
  init () {

    const documentElement = document.querySelector('html');
    const zPeepsList = document.getElementById('z-peeps');
    const zPeepsIdentify = document.getElementById('z-peeps-identify');
    const pushNotifier = document.getElementById('push-notifier');

    //Send push notification to pinguined users
    pushNotifier.addEventListener('click', () => {
      pushNotifier.disabled = true;
      pushNotifier.textContent = 'Notifying...';
      fetch(PenguinReport.ROOT_URI + '/notify/' + location.search).then((response) => {
        if (response.status !== 200) {
          pushNotifier.textContent = 'Error notifyng';
          console.log('Looks like there was a problem. Status Code: ' + response.status);
          throw new Error();
        }
        return response.json().then((data) => {
          console.log('the data', data);
          if (data.nopinguins) {
            pushNotifier.textContent = 'No people to notify!!!!';
          } else {
            if (data.failure) {
              pushNotifier.textContent = 'Notifications sent but with problems';
            } else {
              pushNotifier.textContent = 'Users notified!!!!';
            }

          }

        }).catch((err) => {
          pushNotifier.textContent = 'Error notifyng';
          console.error('Unable to retrieve data', err);
        });
      });
    }, false);

    zPeepsIdentify.addEventListener('click', () => {

      const selectedPeep = zPeepsList.options[zPeepsList.selectedIndex];

      if(selectedPeep.value) {
        localStorage.setItem(PenguinReport.STORAGE_IDENTIFIER, zPeepsList.value + '|' + selectedPeep.text);
        documentElement.classList.remove('z-peeps-visible');
        PenguinReport.register();
      }
    }, false);

    if (!localStorage.getItem(PenguinReport.STORAGE_IDENTIFIER)) {
      documentElement.classList.add('z-peeps-visible');
    } else {
      PenguinReport.register();
    }
  }
};

//Initialize
PenguinReport.init();
