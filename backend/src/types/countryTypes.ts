interface ICountry {
    name: string;
    password: string;
}

interface ICountryRegistration {
    name: string;
    email: string;
    password: string;
}

interface ICountryJson {
    name: string;
    alpha3: string;
}
interface ICountryDocument extends ICountryRegistration {
    countryCode: string;
    registrationNumber: string;
    createdAt: Date;
    updatedAt: Date;
}

export type { ICountry, ICountryRegistration, ICountryJson, ICountryDocument };