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
    alpha2: string;
    officialName: string;
}


interface ICountryDocument extends ICountryRegistration {
    countryCode: string;
    userType: 'country';
    registrationNumber: string;
    refreshToken?: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type { ICountry, ICountryRegistration, ICountryJson, ICountryDocument };