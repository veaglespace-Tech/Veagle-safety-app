import React, { useState, useCallback, useRef } from 'react';
import {
  checkLocationPermissions,
  requestPermissionsAfterConsent,
  handleDisclosureDecline,
} from '../services/permissionService';
import ProminentDisclosureModal from '../components/common/ProminentDisclosureModal';

/**
 * useLocationDisclosure hook
 * 
 * Implements Google Play's Two-Step Prominent Disclosure and Consent Flow:
 * 1. Checks if permissions are already granted.
 * 2. If not, displays the ProminentDisclosureModal FIRST before any native dialogs.
 * 3. On "Agree", triggers native Android runtime permissions.
 * 4. On "Decline", dismisses the dialog and DOES NOT trigger any native runtime permissions.
 */
export function useLocationDisclosure() {
  const [visible, setVisible] = useState(false);
  const pendingActionsRef = useRef({ onProceed: null, onCancel: null });

  /**
   * Check permissions and present the disclosure dialog if needed before continuing.
   */
  const requestWithDisclosure = useCallback(async (onProceed, onCancel) => {
    pendingActionsRef.current = { onProceed, onCancel };

    const status = await checkLocationPermissions();
    if (status.foregroundGranted) {
      // Permissions already granted — proceed immediately without prompting
      if (typeof onProceed === 'function') {
        onProceed(status);
      }
      return;
    }

    // Permissions not granted — show custom prominent disclosure dialog FIRST
    setVisible(true);
  }, []);

  /**
   * User tapped "Agree" on the Prominent Disclosure dialog.
   * Now trigger native Android runtime permission prompts.
   */
  const onAgree = useCallback(async () => {
    setVisible(false);

    // Trigger native Android runtime permission prompt
    const result = await requestPermissionsAfterConsent();

    if (result.foregroundGranted) {
      if (typeof pendingActionsRef.current.onProceed === 'function') {
        pendingActionsRef.current.onProceed(result);
      }
    } else {
      if (typeof pendingActionsRef.current.onCancel === 'function') {
        pendingActionsRef.current.onCancel({ reason: 'native_permission_denied' });
      }
    }
  }, []);

  /**
   * User tapped "Decline" on the Prominent Disclosure dialog.
   * Dismiss the dialog, cancel the action, and DO NOT trigger native Android prompts.
   */
  const onDecline = useCallback(async () => {
    setVisible(false);

    // Record decline without calling native prompts
    await handleDisclosureDecline();

    if (typeof pendingActionsRef.current.onCancel === 'function') {
      pendingActionsRef.current.onCancel({ reason: 'disclosure_declined' });
    }
  }, []);

  const DisclosureModal = useCallback(() => (
    <ProminentDisclosureModal
      visible={visible}
      onAgree={onAgree}
      onDecline={onDecline}
    />
  ), [visible, onAgree, onDecline]);

  return {
    isDisclosureVisible: visible,
    requestWithDisclosure,
    onAgree,
    onDecline,
    DisclosureModal,
  };
}
