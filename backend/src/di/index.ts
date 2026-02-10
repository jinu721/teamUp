export class Container {
    private services = new Map<string, any>();

    register(name: string, service: any) {
        this.services.set(name, service);
    }

    get<T>(name: string): T {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service ${name} not found in container`);
        }
        return service;
    }
}

export const createContainer = () => {
    const container = new Container();
    // Register services here as needed
    return container;
};
