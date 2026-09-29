import { normalizeProviderId } from "@earendil-works/pi-ai";
import { getCredentialAccountSnapshot } from "../../core/credential-accounts.ts";
import { CredentialSlotRepository } from "../../core/credential-pool/state-store.ts";
import type { FooterDataProvider } from "../../core/footer-data-provider.ts";
import type { InteractiveSession } from "./interactive-host-runtime.ts";

/** Local and shared-host sessions use the same secret-free session event surface. */
export function bindFooterCredentialAccounts(footer: FooterDataProvider, session: InteractiveSession): void {
	if (normalizeProviderId(session.state.model?.provider ?? "") !== "chatgpt-subscription") {
		footer.setCredentialAccountSource(undefined);
		return;
	}
	const repository = new CredentialSlotRepository(session.modelRuntime.getCredentialPoolStatePath());
	footer.setCredentialAccountSource({
		sessionId: session.sessionManager.getSessionId(),
		load: () =>
			getCredentialAccountSnapshot(session.modelRegistry.authStorage, "chatgpt-subscription", {}, repository),
		subscribe: (listener) =>
			session.subscribe((event) => {
				if (event.type === "credential_account_attempt" || event.type === "credential_accounts_changed")
					listener(event);
			}),
	});
}
