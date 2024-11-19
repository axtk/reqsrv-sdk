export type Params = {
    /**
     * Target SDK directory.
     */
    target?: string;
    /**
     * Location of the SDK definition.
     * @default 'src/sdk.ts'
     */
    sdk: string;
    /**
     * Location of the reference API schema.
     * @default 'src/types/APISchema.ts'
     */
    schema: string;
    /**
     * Destination for the generated SDK schema.
     * @default 'src/types/SDKSchema.ts'
     */
    output: string;
    /**
     * Location of the method type definitions.
     * @default 'src/types/methods'
     */
    methods: string;
    /**
     * Location of the error type if its namespaced version
     * should be added to the SDK types.
     */
    error?: string;
    /**
     * Whitespace indentation unit size.
     * @default 4
     */
    tab: number;
    /**
     * Namespace prefix for the generated type namespaces.
     * @default 'SDK'
     */
    ns?: string;
    nsin?: string;
    nsout?: string;
    nsres?: string;
};
