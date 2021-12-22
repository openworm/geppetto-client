export interface SearchProps {
    datasource: string;
    searchConfiguration: any,
    datasourceConfiguration: any;
    searchStyle?: any;
    filtersListener? : any;
    customDatasourceHandler?: Function
};

export interface SearchState {
    isOpen: boolean;
    value: string;
    filters: Array<any>
};

export interface ResultsProps {
  data: Array<any>;
  configuration: any;
  closeHandler: Function;
  clickHandler: Function;
  topAnchor: number;
  searchStyle?: any;
}

export interface FiltersProps {
    filters: Array<any>;
    searchStyle?: any;
    filtersListener? : any;
    filters_expanded?: Boolean;
    setFilters: Function;
    openFilters?: Function;
}
