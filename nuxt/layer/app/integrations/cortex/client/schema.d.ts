// openapi.json sha256: 094a6dd054af484226dc242eef7ba7d55db80e1009cb643d22974b5a0ba92124; generated, do not edit. Regenerate with: composer client:generate
export interface paths {
    "/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.search.index"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/concrete-agents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.concrete-agents.index"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/concrete-agents/{agent}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.concrete-agents.show"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/concrete-agents/{agent}/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["cortex.concrete-agents.run"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/concrete-agents/{agent}/tools": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["cortex.concrete-agents.tools.update"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/concrete-agents/{agent}/override": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["cortex.concrete-agents.override.destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/concrete-agents/{agent}/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.concrete-agents.versions.index"];
        put?: never;
        post: operations["cortex.concrete-agents.versions.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/concrete-agents/{agent}/versions/{version}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["cortex.concrete-agents.versions.publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.history.index"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/servers/{server}/instructions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.servers.instructions.show"];
        put?: never;
        post?: never;
        delete: operations["cortex.servers.instructions.destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/servers/{server}/instructions/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.servers.instructions.versions.index"];
        put?: never;
        post: operations["cortex.servers.instructions.versions.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/servers/{server}/instructions/versions/{version}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["cortex.servers.instructions.versions.publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/servers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.servers.index"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/servers/{server}/tools": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["cortex.servers.tools.update"];
        post?: never;
        delete: operations["cortex.servers.tools.destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/providers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.providers.index"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/redirect-domains": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.redirect-domains.index"];
        put?: never;
        post: operations["cortex.redirect-domains.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/redirect-domains/{domain}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["cortex.redirect-domains.destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/runnable-agents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.runnable-agents.index"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/settings-summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.settings-summary.show"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tools": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.tools.index"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tools/{tool}/description": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.tools.description.show"];
        put?: never;
        post?: never;
        delete: operations["cortex.tools.description.destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tools/{tool}/description/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.tools.description.versions.index"];
        put?: never;
        post: operations["cortex.tools.description.versions.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tools/{tool}/description/versions/{version}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["cortex.tools.description.versions.publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/virtual-agents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.virtual-agents.index"];
        put?: never;
        post: operations["cortex.virtual-agents.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/virtual-agents/{agent}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.virtual-agents.show"];
        put?: never;
        post?: never;
        delete: operations["cortex.virtual-agents.destroy"];
        options?: never;
        head?: never;
        patch: operations["cortex.virtual-agents.update"];
        trace?: never;
    };
    "/virtual-agents/{agent}/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["cortex.virtual-agents.run"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/virtual-agents/{agent}/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.virtual-agents.versions.index"];
        put?: never;
        post: operations["cortex.virtual-agents.versions.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/virtual-agents/{agent}/versions/{version}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["cortex.virtual-agents.versions.show"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/virtual-agents/{agent}/versions/{version}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["cortex.virtual-agents.versions.publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** AgentReferenceResource */
        AgentReferenceResource: {
            type: string;
            key: string;
            name: string;
        };
        /** AgentRunResource */
        AgentRunResource: {
            text: string;
            usage: string;
        };
        /** ConcreteAgentOverrideResource */
        ConcreteAgentOverrideResource: {
            agent: string;
            published_version: number | null;
            published_content: string | null;
            tools: string[] | null;
            created_at: string | null;
            updated_at: string | null;
        };
        /** ConcreteAgentOverrideVersionResource */
        ConcreteAgentOverrideVersionResource: {
            version: number;
            content: string;
            created_at: string | null;
        };
        /** ConcreteAgentResource */
        ConcreteAgentResource: {
            name: string;
            overridable: string;
            tools_overridable: string;
            instructions: string;
            tools: string;
            default_instructions?: string | null;
            default_tools: string;
            published_version: string | null;
            tools_overridden: boolean;
        };
        /** McpInstructionResource */
        McpInstructionResource: {
            server: string;
            published_version: number | null;
            published_content: string | null;
            created_at: string | null;
            updated_at: string | null;
        } & {
            [key: string]: unknown;
        };
        /** McpInstructionVersionResource */
        McpInstructionVersionResource: {
            version: number;
            content: string;
            created_at: string | null;
        };
        /** McpServerResource */
        McpServerResource: {
            name: string;
            instructions: string;
        } & {
            [key: string]: unknown;
        };
        /** RunConcreteAgentRequest */
        RunConcreteAgentRequest: {
            input: string;
        };
        /** RunVirtualAgentRequest */
        RunVirtualAgentRequest: {
            input: string;
        };
        /** SettingsSummaryResource */
        SettingsSummaryResource: {
            providers: string;
            tool_count: string;
            agent_count: string;
            server_count: string;
            cache_enabled: string;
        };
        /** StoreConcreteAgentVersionRequest */
        StoreConcreteAgentVersionRequest: {
            content: string;
            publish?: boolean;
        };
        /** StoreMcpInstructionVersionRequest */
        StoreMcpInstructionVersionRequest: {
            content: string;
            publish?: boolean;
        };
        /** StoreRedirectDomainRequest */
        StoreRedirectDomainRequest: {
            owner_type?: string | null;
            owner_id?: string | null;
            domain: string;
        };
        /** StoreToolDescriptionVersionRequest */
        StoreToolDescriptionVersionRequest: {
            content: string;
            publish?: boolean;
        };
        /** StoreVirtualAgentRequest */
        StoreVirtualAgentRequest: {
            name: string;
            slug: string;
            description?: string | null;
            instructions: string;
            provider?: string | null;
            model?: string | null;
            settings?: {
                temperature?: number;
                max_steps?: number;
                max_tokens?: number;
                top_p?: number;
            };
            tools?: ("lookup-order" | "refund-order" | "search-knowledge-base" | "create-ticket" | "check-inventory" | "current-time" | "list-audit-entries-tool" | "show-audit-entry-tool" | "record-audit-event-tool")[];
            sub_agents?: string[];
            concrete_sub_agents?: ("support-triage" | "refund-agent" | "catalog-agent" | "summarizer")[];
        };
        /** StoreVirtualAgentVersionRequest */
        StoreVirtualAgentVersionRequest: {
            content: string;
            publish?: boolean;
        };
        /** ToolDescriptionResource */
        ToolDescriptionResource: {
            tool: string;
            published_version: number | null;
            published_content: string | null;
            created_at: string | null;
            updated_at: string | null;
        };
        /** ToolDescriptionVersionResource */
        ToolDescriptionVersionResource: {
            version: number;
            content: string;
            created_at: string | null;
        };
        /** ToolResource */
        ToolResource: {
            name: string;
            description: string;
            schema: string;
            tags: string;
        };
        /** UpdateVirtualAgentRequest */
        UpdateVirtualAgentRequest: {
            name?: string;
            description?: string | null;
            instructions?: string;
            provider?: string | null;
            model?: string | null;
            settings?: {
                temperature?: number;
                max_steps?: number;
                max_tokens?: number;
                top_p?: number;
            };
            tools?: ("lookup-order" | "refund-order" | "search-knowledge-base" | "create-ticket" | "check-inventory" | "current-time" | "list-audit-entries-tool" | "show-audit-entry-tool" | "record-audit-event-tool")[];
            sub_agents?: string[];
            concrete_sub_agents?: ("support-triage" | "refund-agent" | "catalog-agent" | "summarizer")[];
        };
        /** VirtualAgentResource */
        VirtualAgentResource: {
            name: string;
            slug: string;
            description: string | null;
            instructions?: string | null;
            published_version?: number | null;
            provider: string | null;
            model: string | null;
            settings: {
                [key: string]: unknown;
            } | null;
            tools: string[];
            sub_agents?: unknown[];
            concrete_sub_agents: string[];
            created_at: string | null;
            updated_at: string | null;
        };
        /** VirtualAgentVersionResource */
        VirtualAgentVersionResource: {
            version: number;
            content: string;
            created_at: string | null;
        };
    };
    responses: {
        /** @description Validation error */
        ValidationException: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** @description Errors overview. */
                    message: string;
                    /** @description A detailed description of each field that failed validation. */
                    errors: {
                        [key: string]: string[];
                    };
                };
            };
        };
        /** @description Authorization error */
        AuthorizationException: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** @description Error overview. */
                    message: string;
                };
            };
        };
        /** @description Not found */
        ModelNotFoundException: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** @description Error overview. */
                    message: string;
                };
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    "cortex.search.index": {
        parameters: {
            query: {
                q: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Array of `AgentReferenceResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["AgentReferenceResource"][];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.concrete-agents.index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Array of `ConcreteAgentResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ConcreteAgentResource"][];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.concrete-agents.show": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                agent: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `ConcreteAgentResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ConcreteAgentResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.concrete-agents.run": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                agent: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RunConcreteAgentRequest"];
            };
        };
        responses: {
            /** @description `AgentRunResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["AgentRunResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.concrete-agents.tools.update": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                agent: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `ConcreteAgentOverrideResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ConcreteAgentOverrideResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.concrete-agents.override.destroy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                agent: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.concrete-agents.versions.index": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                agent: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Array of `ConcreteAgentOverrideVersionResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ConcreteAgentOverrideVersionResource"][];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.concrete-agents.versions.store": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                agent: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StoreConcreteAgentVersionRequest"];
            };
        };
        responses: {
            /** @description `ConcreteAgentOverrideVersionResource` */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ConcreteAgentOverrideVersionResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.concrete-agents.versions.publish": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                agent: string;
                version: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `ConcreteAgentOverrideResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ConcreteAgentOverrideResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.history.index": {
        parameters: {
            query?: {
                subject_type?: string | null;
                subject_id?: string | null;
                action?: string | null;
                per_page?: number | null;
                cursor?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": string;
                };
            };
            403: components["responses"]["AuthorizationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        message: "Auditing is turned off for this package.";
                    } | {
                        /** @constant */
                        message: "No audit log is installed. Install refactor-circus/keen to record history.";
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.servers.instructions.show": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                server: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `McpInstructionResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["McpInstructionResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.servers.instructions.destroy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                server: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `McpInstructionResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["McpInstructionResource"];
                    };
                };
            };
            /** @description No content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.servers.instructions.versions.index": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                server: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Array of `McpInstructionVersionResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["McpInstructionVersionResource"][];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.servers.instructions.versions.store": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                server: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StoreMcpInstructionVersionRequest"];
            };
        };
        responses: {
            /** @description `McpInstructionVersionResource` */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["McpInstructionVersionResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.servers.instructions.versions.publish": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                server: string;
                version: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `McpInstructionResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["McpInstructionResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.servers.index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Array of `McpServerResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["McpServerResource"][];
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.servers.tools.update": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                server: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `McpInstructionResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["McpInstructionResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.servers.tools.destroy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                server: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.providers.index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: string;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.redirect-domains.index": {
        parameters: {
            query?: {
                owner_type?: string | null;
                owner_id?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": string;
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.redirect-domains.store": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StoreRedirectDomainRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": string;
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.redirect-domains.destroy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                domain: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.runnable-agents.index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Array of `AgentReferenceResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["AgentReferenceResource"][];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.settings-summary.show": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `SettingsSummaryResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["SettingsSummaryResource"];
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.tools.index": {
        parameters: {
            query?: {
                tag?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Array of `ToolResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ToolResource"][];
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.tools.description.show": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                tool: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `ToolDescriptionResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ToolDescriptionResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.tools.description.destroy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                tool: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.tools.description.versions.index": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                tool: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Array of `ToolDescriptionVersionResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ToolDescriptionVersionResource"][];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.tools.description.versions.store": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                tool: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StoreToolDescriptionVersionRequest"];
            };
        };
        responses: {
            /** @description `ToolDescriptionVersionResource` */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ToolDescriptionVersionResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.tools.description.versions.publish": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                tool: string;
                version: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `ToolDescriptionResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ToolDescriptionResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.virtual-agents.index": {
        parameters: {
            query?: {
                per_page?: number | null;
                page?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Array of `VirtualAgentResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["VirtualAgentResource"][];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.virtual-agents.store": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StoreVirtualAgentRequest"];
            };
        };
        responses: {
            /** @description `VirtualAgentResource` */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["VirtualAgentResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.virtual-agents.show": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The agent slug */
                agent: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `VirtualAgentResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["VirtualAgentResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.virtual-agents.destroy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The agent slug */
                agent: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.virtual-agents.update": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The agent slug */
                agent: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["UpdateVirtualAgentRequest"];
            };
        };
        responses: {
            /** @description `VirtualAgentResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["VirtualAgentResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.virtual-agents.run": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The agent slug */
                agent: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RunVirtualAgentRequest"];
            };
        };
        responses: {
            /** @description `AgentRunResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["AgentRunResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.virtual-agents.versions.index": {
        parameters: {
            query?: {
                per_page?: number | null;
                page?: number | null;
            };
            header?: never;
            path: {
                /** @description The agent slug */
                agent: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Array of `VirtualAgentVersionResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["VirtualAgentVersionResource"][];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.virtual-agents.versions.store": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The agent slug */
                agent: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StoreVirtualAgentVersionRequest"];
            };
        };
        responses: {
            /** @description `VirtualAgentVersionResource` */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["VirtualAgentVersionResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.virtual-agents.versions.show": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The agent slug */
                agent: string;
                version: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `VirtualAgentVersionResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["VirtualAgentVersionResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "cortex.virtual-agents.versions.publish": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The agent slug */
                agent: string;
                version: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description `VirtualAgentResource` */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["VirtualAgentResource"];
                    };
                };
            };
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
}
